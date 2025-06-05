You should only work on the codebase in the path `custom_nodes/X-FLuxAgent` and check & index the code under this path
You may need to run any test or install packages with `source venv_xcomfyui/bin/activate`
Please don't try to start the comfyUI for test, as I will test manually. 
You can write test code to test any js and python code, but please donot test with a running comfyui instance, as I will test it manually.

Please create a ComfyUI chatbot custom tab with the following requirements:

1. Update the files for the implement: `fluxagent/ChatBotService.py` and `js/fluxagent/ChatBotTab.js`.

2. Integrate the OpenAI Chat API. Refer to the existing implementation in `fluxagent/OpenaiChatNode.py`.

3. Design the chatbot UI as follows:

   * At the top, include a Markdown-formatted text area. Bot messages with markdown style will be appended here. The area should auto-scroll to show the latest content unless the user manually scrolls.
   * At the bottom, provide a multi-line textarea for user input, with a send button on the right.

4. When the user sends a message:

   * The chatbot should respond using `PromptServer.instance.send_sync("X-FluxAgent.chatbot.message", a_dictionary)` in the python code.
   * Both user message and the bot's reply should be displayed in the top area (do not display the user's message).
   * Include a loading indicator to inform the user that the bot is generating a reply.

5. fluxagent/ChatBotService.py should be run in the life time of comfyui is running


## ComfyUI workflow based coding agent design 

### Background

Traditonally, we first design UML/FlowDiagram, then do the code, but we can do

1. first have the flow diagram/comfyUI workflow
2. each node has inputs and outputs, just has a function's parameters and return values 
3. each node has a description in markdown format for the inputs and outputs, and the node/function itself's features and immeplementations 
4. each nodde will be matching to a functions 
5. functons call each other will be defined by the links between each nodes
6. the functions invoken timing will be controlled by comfyUI workflow itself
7. each funciton just a simple function, so we can each to have a test case  

Here is sample for how we change the software to a workflow based AI coding

Node 1: User give a prompt: I want to build a audio book video for topic: "A cat learns how to fly"
Node 2: Create scenses based on the story, and output in format 
```json
[
  {
    "title": "string", 
    "content": "string",
    "prompt": "string - prompt for image creation"
  }
]
```
Node 3: Using openAI `gpt-image-1` model to create image for each scene by the `prompt`
Node 4: Using openAI text to speech model `tts-1-hd` to create an audio file in mp3 format for each scene by `content`
Node 5: Using FFMpeg to create video with the images and audio files to create a video, and save it as a mp4 file (it can have default file name and location, user can update it)

We will use AI to generate these node, and the relationship, inputs and outputs to fully use the comfyUI's feature.

Once we have the workflow, we will ask user to do a review, then may update the description for each node, inputs, outputs, and default values etc

Once the user confirmed the design, we will create the function for each node, and finally, once use just run the workflow as normal comfyui workflow to generate a video in real time.

### Core Logic

1. data type, please refer to `const dataTypes` at custom_nodes/X-FLuxAgent/js/fluxagent/AICodeGenNode.js

```js
// all the data type we need to support
const dataTypes = [
    "string", "int", "float" ,"boolean", "combo", "image", "audio", "json", "any"
];
```
Most are mapping to ComfyUI custom node datatype

* COMBO - list[str], output value is str
* INT - int
* FLOAT - float
* STRING - str
* BOOLEAN - bool
* IMAGE - torch.Tensor with shape [B,H,W,C]
* AUDIO - dict: {"sample_rate": "number", "waveform": "containing a torch.Tensor with shape [B, C, T]"}
* any - Python any data type
* JSON - a valid json str


2. the below two files are the magic we will do

- custom_nodes/X-FLuxAgent/js/fluxagent/AICodeGenNode.js
- custom_nodes/X-FLuxAgent/fluxagent/AICodeGenNode.py

3. the generated comfyui custom node and test code will be put to

- custom_nodes/X-FLuxAgent/test/generated/project_01 - for test code
- custom_nodes/X-FLuxAgent/user/generated/project_01 - for node code

the default generated project name will be project_01, 02, 03, ..., automatically 
the default node category will be: X-FluxAgent-User/project_xx
the default NODE_CLASS_MAPPINGS will be registrated as X-FluxAgent-USER.NameNode

the node file name will be XxxxxNode.py, and any support files, will be YxxZxx.py, without Node suffix in the file name.
for each node, we will use `process` as the default function name for comfyUI

4. we can run and test the workflow in the coding workflow, as logic below

in func `process` in file custom_nodes/X-FLuxAgent/fluxagent/AICodeGenNode.py
we will check the file custom_nodes/X-FLuxAgent/user/generated/project_01/XxxxxNode.py if it is exist, if yes, we will invoke the file as a process with the inputs and return the outputs data to comfyui, so we can islate the generated code with the  X-FluxAgent core logic code.

So user can test the code in place without to create a new workflow


### LangGraph powered ComfyUI workflow coding agent 


