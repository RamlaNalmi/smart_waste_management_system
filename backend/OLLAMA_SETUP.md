# Ollama Setup Instructions

## 1. Install Ollama

Download and install Ollama from: https://ollama.ai/

## 2. Pull a Model

Open a terminal and run:
```bash
# Pull Llama 2 (recommended for this project)
ollama pull llama2

# Or try other models:
ollama pull mistral
ollama pull codellama
```

## 3. Start Ollama Server

```bash
ollama serve
```

Ollama will run on `http://localhost:11434` by default.

## 4. Test Ollama

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Hello, how are you?"
}'
```

## 5. Available Models

Check what models you have installed:
```bash
ollama list
```

## Configuration

Update your `.env` file with the correct model name:
```
OLLAMA_MODEL=llama2  # or mistral, codellama, etc.
```

## Troubleshooting

- Make sure Ollama is running before starting the backend
- Check that the model is downloaded: `ollama list`
- Verify the API endpoint: `curl http://localhost:11434/api/tags`