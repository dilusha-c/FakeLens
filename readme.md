# FakeLens - Fake News Verification Assistant

FakeLens is a chat-based AI-powered fact-checking assistant that helps users verify news articles, links, and claims. It analyzes content to determine whether it's likely fake, real, or uncertain, providing clear explanations and evidence from trusted sources.

## ✨ Key Features

- **Chat-Based Interface**: Familiar ChatGPT-like experience with conversation history
- **Claim Analysis**: Paste text or URLs to get instant fact-checking
- **Evidence Gathering**: Searches trusted news sources and fact-checking databases
- **Visual Results**: Clear verdict cards with fake likelihood percentages
- **Follow-Up Questions**: Ask for more details about the analysis
- **Share Reports**: Generate public links to share analysis results
- **Conversation History**: Manage multiple fact-checking sessions

## 🎯 Who Is It For

- Everyday users checking viral posts
- Students learning media literacy
- Journalists verifying sources
- Anyone wanting quick credibility checks before sharing content

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Search**: Bing Search API, Google Fact Check API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- API keys for:
  - Bing Search API
  - Google Fact Check Tools API
  - Google Gemini API

### Installation

1. Clone the repository and navigate to the project folder:

```bash
cd FakeLens
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory with your API keys:

```env
BING_SEARCH_API_KEY=your_bing_api_key_here
GOOGLE_FACTCHECK_API_KEY=your_google_factcheck_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🧠 How It Works

### Claim Analysis Process

1. **Input Detection**: System determines if input is a new claim or follow-up question
2. **Content Extraction**: For URLs, extracts main article text using web scraping
3. **Fake Detection**: Rule-based analysis checks for:
   - Sensational language
   - Excessive punctuation
   - Lack of sources
   - Emotional manipulation
   - Conspiracy-related terms
4. **Evidence Search**:
   - Searches Bing for relevant articles from trusted news sources
   - Queries Google Fact Check API for fact-checking articles
   - Classifies links as supporting or debunking evidence
5. **AI Response**: Gemini generates clear explanations based on analysis data
6. **Result Display**: Shows verdict card with confidence, reasons, and evidence links

### Verdict Categories

- **Likely Fake**: High fake likelihood score (65%+)
- **Likely Real**: Low fake likelihood score (35% or less)
- **Uncertain**: Middle range scores

## 🗂 Project Structure

```
FakeLens/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Main chat endpoint
│   │   └── report/
│   │       └── route.ts          # Share report endpoint
│   ├── report/
│   │   └── [id]/
│   │       └── page.tsx          # Public report page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page
├── components/
│   ├── ChatInput.tsx             # Input bar with share button
│   ├── ChatMessages.tsx          # Message list container
│   ├── ChatSidebar.tsx           # Chat history sidebar
│   ├── MessageBubble.tsx         # Individual message component
│   └── ResultCard.tsx            # Analysis result card
├── lib/
│   ├── evidenceSearch.ts         # Bing & Google API integration
│   ├── fakeDetector.ts           # Rule-based fake detection
│   ├── geminiClient.ts           # Gemini API integration
│   └── textExtractor.ts          # URL content extraction
├── types/
│   └── index.ts                  # TypeScript type definitions
└── package.json
```

## 🧩 API Endpoints

### POST /api/chat

Analyzes claims and answers follow-up questions.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "claim or question text" }
  ],
  "analysis": { /* previous analysis if exists */ }
}
```

**Response:**
```json
{
  "message": "AI response text",
  "analysis": {
    "claimText": "...",
    "verdict": "fake" | "real" | "uncertain",
    "confidence": 0.85,
    "reasons": ["..."],
    "supportLinks": [...],
    "debunkLinks": [...]
  }
}
```

### POST /api/report

Creates a shareable public report.

**Request:**
```json
{
  "analysis": { /* analysis object */ }
}
```

**Response:**
```json
{
  "id": "unique_id",
  "url": "https://fakelens.com/report/unique_id"
}
```

### GET /api/report?id={reportId}

Retrieves a stored report.

## 🔐 Configuration

### API Keys

#### Bing Search API
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Bing Search v7 resource
3. Copy the API key

#### Google Fact Check API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Fact Check Tools API
3. Create credentials and copy the API key

#### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Generate an API key
3. Copy the key

### Trusted News Domains

Edit `lib/evidenceSearch.ts` to customize the list of trusted news sources:

```typescript
const TRUSTED_DOMAINS = [
  'bbc.com', 'reuters.com', 'apnews.com',
  // Add your trusted sources
];
```

## Usage Examples

### Verify a News Article

1. Paste the article URL or text into the input field
2. Click Send
3. Review the verdict card showing:
   - Likely Fake/Real/Uncertain label
   - Fake likelihood percentage
   - Analysis reasons
   - Supporting and debunking sources

### Ask Follow-Up Questions

After analyzing a claim, ask questions like:
- "Why is this fake?"
- "What evidence do you have?"
- "Which sources debunk this?"

### Share Results

1. Click the share button in the input bar
2. Copy the public URL
3. Share via WhatsApp, X (Twitter), or Facebook

## 📌 Important Notes

### Limitations

- **Not 100% Accurate**: This is an automated system using rule-based detection and AI
- **Requires Verification**: Always cross-reference with multiple trusted sources
- **No Image Analysis**: Currently only analyzes text content
- **API Dependencies**: Requires active API keys for full functionality

### Disclaimer

FakeLens provides automated estimations based on content analysis and internet searches. It should be used as a guide only, not as the sole source of truth. Users must:

- Verify claims with official sources
- Use critical thinking
- Consider multiple perspectives
- Check original sources directly

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Lint Code

```bash
npm run lint
```

## 🚀 Future Enhancements

- [ ] Database integration for persistent storage
- [ ] User authentication
- [ ] Image analysis using computer vision
- [ ] Browser extension
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced ML-based fake detection
- [ ] Real-time monitoring of trending claims
- [ ] Edited image detection
- [ ] Reverse image search for misinformation
- [ ] AI-generated image detector

## Contributing

Contributions are welcome! Please ensure code follows the existing style and includes proper TypeScript types.

## License

MIT License

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Remember**: FakeLens is a digital companion that helps users investigate suspicious news and avoid misinformation, using real internet evidence and a friendly conversation style. It is not a perfect truth machine but provides an automated first check with transparent reasoning and sources.
