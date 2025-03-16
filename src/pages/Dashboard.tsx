import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Volume2, User, ArrowRight, Settings, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Message type for chat history
interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// ChatMessage component
const ChatMessage = ({ message, isUser, timestamp }: { message: string; isUser: boolean; timestamp: Date }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[80%] rounded-xl px-4 py-3 ${isUser ? 'bg-white text-black' : 'bg-[#111] text-white'
        }`}
    >
      <p className="text-sm">{message}</p>
      <div className="mt-1">
        <p className="text-xs text-gray-500">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  </div>
);

// ListeningIndicator component
const ListeningIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-[#111] text-white max-w-[80%] rounded-xl px-4 py-3">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-white/80">Listening...</p>
      </div>
    </div>
  </div>
);

// ProcessingIndicator component
const ProcessingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-[#111] text-white max-w-[80%] rounded-xl px-4 py-3">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-white/80">Processing...</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm your visual assistant. I can help describe what's around you. Press the Listen button and speak when you need assistance.",
      isUser: false,
      timestamp: new Date()
    }
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize camera when component mounts
  useEffect(() => {
    initializeCamera();

    // Clean up on component unmount
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Initialize web camera
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraPermission(true);
        addMessage("Camera is ready. Press the Listen button and ask me what you'd like to know about your surroundings.", false);
        speak("Camera is ready. Press the Listen button and ask me what you'd like to know about your surroundings.");
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      addMessage("I couldn't access your camera. Please check your browser permissions and try again.", false);
      speak("I couldn't access your camera. Please check your browser permissions and try again.");
    }
  };

  // Initialize audio recording
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];

        await processAudio(audioBlob);
      };

      return true;
    } catch (err) {
      console.error('Error initializing audio:', err);
      addMessage("I couldn't access your microphone. Please check your browser permissions and try again.", false);
      speak("I couldn't access your microphone. Please check your browser permissions and try again.");
      return false;
    }
  };

  // Process audio with Deepgram
  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      const response = await fetch('https://seeforme.riteshh.workers.dev/transcribe', {
        method: 'POST',
        body: audioBlob
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.transcript && data.transcript.trim() !== '') {
        setSpokenText(data.transcript);
        addMessage(data.transcript, true);
        await processUserQuery(data.transcript);
      } else {
        addMessage("I didn't catch that. Could you please try speaking again?", false);
        speak("I didn't catch that. Could you please try speaking again?");
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      addMessage("I'm having trouble understanding you. Please try again.", false);
      speak("I'm having trouble understanding you. Please try again.");
    } finally {
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  // Capture image from video stream
  // Enhanced image capture function
  const captureImage = () => {
    return new Promise<string | null>((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || !video.videoWidth) {
        console.error('Video or canvas not ready');
        addMessage("I'm having trouble capturing what's in front of the camera. Please try again.", false);
        speak("I'm having trouble capturing what's in front of the camera. Please try again.");
        resolve(null);
        return;
      }

      try {
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Could not get canvas context');
          resolve(null);
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Verify we have actual image data
        if (imageData.length < 1000) {
          console.error('Image data too small, likely invalid');
          resolve(null);
          return;
        }

        // Remove the data:image/jpeg;base64, prefix
        const base64Data = imageData.split(',')[1];
        resolve(base64Data);
      } catch (error) {
        console.error('Error capturing image:', error);
        resolve(null);
      }
    });
  };

  // Start listening for voice commands
  const startListening = async () => {
    if (isListening || isProcessing) return;

    if (!cameraPermission) {
      await initializeCamera();
      return;
    }

    // Initialize audio if not already done
    if (!mediaRecorderRef.current) {
      const success = await initializeAudio();
      if (!success) return;
    }

    try {
      setIsListening(true);
      audioChunksRef.current = [];

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start();

        // Stop recording after 5 seconds
        listeningTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 5000);
      } else {
        throw new Error('MediaRecorder not initialized');
      }
    } catch (e) {
      console.error('Error starting audio recording:', e);
      setIsListening(false);
      addMessage("There was an error with the audio recording. Please try again.", false);
      speak("There was an error with the audio recording. Please try again.");
    }
  };

  // Process user's question and image
  // Process user's question and image
  const processUserQuery = async (query: string) => {
    if (!query) return;

    // Normalized query for easier matching
    const normalizedQuery = query.toLowerCase().trim();

    // Enhanced vision queries including "holding" and other object-related phrases
    const visionQueries = [
      // Scene description queries
      'what is in front of me',
      'what do you see',
      'what is this',
      'describe this',
      'what can you see',
      'identify this',
      'what is around',
      'what is there',
      'tell me what you see',
      'describe the scene',
      'what is happening',
      'what is going on',

      // Object identification queries
      'what am i holding',
      'what is in my hand',
      'identify this object',
      'what object is this',
      'tell me about this object',
      'what is this thing',
      'what is this item',

      // Reading text queries
      'what does this say',
      'read this',
      'can you read this',
      'what is written',
      'what text do you see',

      // Spatial awareness queries
      'is there anything in front of me',
      'is there a wall',
      'am i about to hit something',
      'is the path clear',
      'is it safe to walk',

      // Color and appearance queries
      'what color is this',
      'describe the color',
      'how does this look',
    ];

    // Action words that typically involve vision
    const visionVerbs = ['see', 'look', 'watch', 'observe', 'check', 'scan', 'view', 'read', 'identify', 'describe'];

    // Object words that typically involve vision when combined with "what is this"
    const objectWords = ['thing', 'object', 'item', 'device', 'product', 'box', 'container', 'bottle', 'package'];

    // Positional words that typically involve vision
    const positionalWords = ['holding', 'hand', 'front', 'ahead', 'near', 'next to', 'beside', 'behind'];

    // More sophisticated vision query detection
    const needsImageProcessing =
      // Direct matches with predefined queries
      visionQueries.some(q => normalizedQuery.includes(q)) ||

      // Contains vision verbs
      visionVerbs.some(verb => normalizedQuery.includes(verb)) ||

      // Contains positional indicators with question words
      (positionalWords.some(word => normalizedQuery.includes(word)) &&
        (normalizedQuery.includes('what') || normalizedQuery.includes('how') || normalizedQuery.includes('where'))) ||

      // "What is this" combined with object words
      (normalizedQuery.includes('what is this') && objectWords.some(word => normalizedQuery.includes(word))) ||

      // Direct questions about visibility
      normalizedQuery.includes('can you see') ||

      // Questions about appearance
      normalizedQuery.includes('how does it look') ||

      // Direct requests for visual help
      normalizedQuery.includes('help me see') ||
      normalizedQuery.includes('tell me what you see');

    setIsProcessing(true);

    try {
      if (needsImageProcessing) {
        // Capture image from camera
        let imageBase64 = null;
        let retryCount = 0;

        // Try up to 3 times to capture a valid image
        while (retryCount < 3 && !imageBase64) {
          imageBase64 = await captureImage();
          if (!imageBase64) {
            console.log(`Image capture failed, retry ${retryCount + 1}/3`);
            retryCount++;
            // Wait briefly before retrying
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (imageBase64) {
          // Determine the specific type of visual query for better context
          let contextualizedQuery = query;

          // Add contextual hints for specific types of queries
          if (normalizedQuery.includes('holding') || normalizedQuery.includes('hand')) {
            contextualizedQuery = `${query} (Focus on objects being held in hands)`;
          } else if (normalizedQuery.includes('read') || normalizedQuery.includes('say') || normalizedQuery.includes('text')) {
            contextualizedQuery = `${query} (Focus on reading any visible text)`;
          } else if (normalizedQuery.includes('color')) {
            contextualizedQuery = `${query} (Focus on colors and visual appearance)`;
          } else if (positionalWords.some(word => normalizedQuery.includes(word))) {
            contextualizedQuery = `${query} (Focus on spatial relationships and positions)`;
          }

          // Process image with LLaVA
          const imageAnalysisResult = await processImageWithLLaVA(imageBase64, contextualizedQuery);

          // Refine response with Gemini
          const refinedResponse = await refineResponseWithGemini(imageAnalysisResult, query);

          addMessage(refinedResponse, false);
          speak(refinedResponse);
        } else {
          const message = "I couldn't capture a clear image. Please make sure there's enough light and try again.";
          addMessage(message, false);
          speak(message);
        }
      } else {
        // Categorize non-vision queries to provide better responses
        let queryType = "general";

        if (normalizedQuery.includes('who are you') || normalizedQuery.includes('what can you do')) {
          queryType = "assistant_info";
        } else if (normalizedQuery.includes('help') || normalizedQuery.includes('how to use')) {
          queryType = "usage_help";
        } else if (normalizedQuery.includes('thank') || normalizedQuery.includes('thanks')) {
          queryType = "gratitude";
        } else if (normalizedQuery.includes('hello') || normalizedQuery.includes('hi ') || normalizedQuery === 'hi') {
          queryType = "greeting";
        }
        // For non-vision queries, add context about query type
        const response = await refineResponseWithGemini(query, queryType);
        addMessage(response, false);
        speak(response);
      }
    } catch (error) {
      console.error('Error processing query:', error);

      // More specific error messages based on where the error occurred
      let errorMessage = "I'm sorry, I couldn't process your request. Please try again.";

      if (error.message?.includes('image')) {
        errorMessage = "I had trouble processing the image. Could you try again with better lighting?";
      } else if (error.message?.includes('network')) {
        errorMessage = "I'm having trouble connecting to the network. Please check your connection and try again.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "The request took too long to process. Please try again.";
      }

      addMessage(errorMessage, false);
      speak(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process image with LLaVA
  const processImageWithLLaVA = async (base64Image: string, query: string): Promise<string> => {
    try {
      // Log the image size to help with debugging
      console.log(`Sending image to LLaVA: ${base64Image.length} bytes`);

      // Call the API route using fetch
      const response = await fetch('https://seeforme.riteshh.workers.dev/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          query: query
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLaVA API error (${response.status}):`, errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.result || data.result.trim() === '') {
        throw new Error('Empty response from LLaVA');
      }

      return data.result;
    } catch (error) {
      console.error('LLaVA processing error:', error);
      throw error;
    }
  };

  // Refine the response using Gemini
  const refineResponseWithGemini = async (llavaResponse: string, originalQuery: string, queryType: string = "general"): Promise<string> => {
    try {
      // Call the API route using fetch
      const response = await fetch('https://seeforme.riteshh.workers.dev/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          llavaResponse,
          originalQuery,
          queryType
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.result || "I'm not sure how to respond to that. Could you try asking in a different way?";
    } catch (error) {
      console.error('Gemini processing error:', error);
      return llavaResponse || "I'm not sure how to respond to that. Could you try asking in a different way?";
    }
  };

  // Add a message to the chat history
  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { text, isUser, timestamp: new Date() }]);
  };

  // Text-to-speech function
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      {/* Header */}
      <header className="bg-black border-b border-[#222] py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <Camera className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-white text-xl font-medium tracking-tight">SeeForMe</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white text-sm hover:text-gray-300 transition-colors">Dashboard</a>
            <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">History</a>
            <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">Settings</a>
            <div className="h-6 w-[1px] bg-gray-800"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <User className="h-4 w-4 text-black" />
              </div>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-[#222] py-4">
          <nav className="flex flex-col space-y-4 px-6">
            <a href="#" className="text-white text-sm py-2 border-b border-[#222]">Dashboard</a>
            <a href="#" className="text-gray-500 text-sm py-2 border-b border-[#222]">History</a>
            <a href="#" className="text-gray-500 text-sm py-2">Settings</a>
          </nav>
        </div>
      )}

      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 bg-black max-w-7xl mx-auto w-full">
        {/* Video Card */}
        <Card className="md:w-1/2 bg-[#0A0A0A] border-[#222] rounded-xl shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-[#222] bg-[#0A0A0A] py-4">
            <CardTitle className="text-white flex items-center text-lg">
              <Camera className="h-5 w-5 mr-3 text-white" />
              Camera Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 relative aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Status indicator */}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium tracking-wide">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${cameraPermission ? 'bg-white' : 'bg-gray-500'}`} />
                {cameraPermission ? 'Camera Active' : 'Camera Inactive'}
              </div>
            </div>

            {/* Listening status */}
            {isListening && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium tracking-wide animate-pulse">
                <div className="flex items-center">
                  <Mic className="h-3 w-3 mr-2 text-white" />
                  Listening...
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Card */}
        <Card className="md:w-1/2 bg-[#0A0A0A] border-[#222] rounded-xl shadow-2xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#222] py-4">
            <CardTitle className="text-white flex items-center text-lg">
              <Mic className="h-5 w-5 mr-3 text-white" />
              Conversation
            </CardTitle>
            <Button
              onClick={startListening}
              disabled={isListening || isProcessing}
              className="bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-full flex items-center space-x-2 transition-all duration-200 disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              <span>Listen</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  message={msg.text}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}
              {isListening && <ListeningIndicator />}
              {isProcessing && <ProcessingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-black border-t border-[#222] py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className={`w-2 h-2 rounded-full mr-2 ${isProcessing ? 'bg-white animate-pulse' : isListening ? 'bg-white animate-pulse' : 'bg-gray-700'}`} />
              <p className="text-gray-400 text-sm tracking-wide">
                {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Ready for voice input'}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-500 text-xs hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 text-xs hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-500 text-xs hover:text-white transition-colors">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
