import json, os
from dotenv import load_dotenv
import utils, agent as ag

load_dotenv()

config = utils.load_config()
executor = ag.build_agent()

for page in config["pages"]:
    outputs = ag.run_agent(executor, page)
    utils.save_outputs(
        page["id"],
        outputs.get("html", ""),
        outputs.get("css",  ""),
        outputs.get("ts",   ""),
    )
    print("Done:", page["id"])
