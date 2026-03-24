# Config-Driven Agentic UI Generator

Hi! Welcome to my Agentic UI Generator project. 

This is a Python tool that uses LangChain and OpenAI to automatically generate Angular UI code (HTML, CSS, and TypeScript) based on a simple JSON configuration. 

Instead of writing everything from scratch, the AI reads your pre-existing Angular templates and then intelligently adapts them for any new entity you define in `config.json`.

## How It Works

1. **`config.json`**: This is where you describe the new page you want to build (e.g. Departments, Employees). You provide the entity name, API endpoint, form fields, and column names here.
2. **`templates/`**: This folder holds the base Angular template files (`template.html`, `template.tsx`, `template.css`).
3. **`agent.py`**: This is the LangChain agent. It has a set of tools to read the config, load the templates, and ask the `gpt-4o-mini` LLM to adapt the code.
4. **`main.py`**: This is the main script that runs the whole process.

## How to Run This Project

### 1. Install Requirements
Make sure you have Python installed, then run:
```bash
pip install -r requirements.txt
```

### 2. Set Your API Key
You will need an OpenAI API key. Create a file named `.env` in the root folder and add your key like this:
```
OPENAI_API_KEY=sk-your-secret-api-key-here
```

### 3. Run the Code!
Just run the main script:
```bash
python main.py
```

The agent will print its thinking steps to the console, and when it finishes, your new Angular UI files will be saved in the `output/` folder!

## Tools Used
- Python
- LangChain (`AgentExecutor`, `@tool`, `ChatPromptTemplate`)
- OpenAI API (`gpt-4o-mini`)
- Angular (for the frontend templates)

---
*Created as a learning project for building agentic AI systems!*
