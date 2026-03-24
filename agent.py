import json
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import utils



llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


@tool
def analyse_config(page_json: str) -> str:
    """Read the page config and return entity metadata as JSON."""
    page = json.loads(page_json)
    return json.dumps({
        "entity":            page.get("entity"),
        "entity_plural":     page.get("entityPlural"),
        "entity_var":        page.get("entityVar"),
        "component_name":    page.get("componentName"),
        "selector":          page.get("componentSelector"),
        "api_endpoint":      page.get("apiEndpoint"),
        "interface_fields":  page.get("interface", {}).get("fields", []),
    }, indent=2)


@tool
def read_template(template_type: str, file_ext: str) -> str:
    """Load a template file from disk. E.g. read_template('webform', 'html')."""
    return utils.load_template(template_type, file_ext)


@tool
def adapt_template(template_content: str, entity_info_json: str, file_type: str) -> str:
    """
    Use LangChain to adapt a template for a new entity.
    file_type must be 'html', 'css', or 'typescript'.
    """
    if len(template_content.strip()) < 50:
        return f"/* empty {file_type} template */"

    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an Angular UI code generator. Return ONLY the adapted code. No markdown fences."),
        ("human", "Adapt this {file_type} template for the new entity.\n\nEntity Info:\n{entity_info}\n\nTemplate:\n{template}")
    ])
    
    chain = prompt | llm
    response = chain.invoke({
        "file_type": file_type,
        "entity_info": entity_info_json,
        "template": template_content
    })
    
    return response.content


@tool
def save_files(page_id: str, html: str, css: str, ts: str) -> str:
    """Save HTML, CSS, and TypeScript files to the output folder."""
    utils.save_outputs(page_id, html, css, ts)
    return f"Files saved for '{page_id}'"



TOOLS = [analyse_config, read_template, adapt_template, save_files]


def build_agent():
    """Build the LangChain Agent using create_tool_calling_agent."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a LangChain automation agent. 
For each page, use your tools in this exact order:
1. analyse_config
2. read_template('webform', 'html') -> adapt_template(type='html')
3. read_template('webform', 'tsx') -> adapt_template(type='typescript')
4. read_template('webform', 'css') -> adapt_template(type='css')
5. save_files (with all 3 adapted strings)"""),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, TOOLS, prompt)
    
  
    return AgentExecutor(agent=agent, tools=TOOLS, verbose=True, max_iterations=10)


def run_agent(executor, page):
    """Run the AgentExecutor for a single page config."""
    result = executor.invoke({"input": f"Process page: {json.dumps(page)}"})
    
  
    outputs = {}
    for action, obs in result.get("intermediate_steps", []):
        if action.tool == "adapt_template":
            ft = action.tool_input.get("file_type", "")
            outputs["ts" if ft == "typescript" else ft] = obs
            
    return outputs
