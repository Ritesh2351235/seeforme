# SeeForMe

**SeeForMe** is an AI-powered real-time video analysis assistant designed to help users interact with their surroundings through their webcam. It can answer user queries about the video feed, making it especially useful for visually impaired individuals.

## Features
- **Real-time Video Analysis:** Processes webcam footage and provides insights.
- **AI Assistant:** Responds to user queries based on video content.
- **Text-to-Speech & Speech-to-Text:** Enables hands-free interaction.
- **Accessibility Focus:** Designed to aid visually impaired users.

## Tech Stack
- **Frontend:** React
- **Backend API Deployment:** Cloudflare JS
- **Video & Image Analysis:** Nebius Studio Llava Model
- **AI Assistant Responses:** Gemini
- **Speech Processing:** Deepgram (for text-to-speech and speech-to-text transcription)

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/seeforme.git
   cd seeforme
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm start
   ```

## Usage
1. Open the app and allow webcam access.
2. Ask questions about the video feed.
3. Get real-time AI-powered responses via text or speech.

## Deployment
To deploy the backend API using Cloudflare:
1. Set up Cloudflare Workers and configure API routes.
2. Deploy using:
   ```sh
   wrangler publish
   ```

## Contributing
1. Fork the repository.
2. Create a feature branch:
   ```sh
   git checkout -b feature-name
   ```
3. Commit changes and push:
   ```sh
   git commit -m "Add new feature"
   git push origin feature-name
   ```
4. Submit a pull request.

## License
This project is licensed under the MIT License.

## Contact
For questions or collaboration, reach out via [email](mailto:riteshhiremath6@gmail.com).

