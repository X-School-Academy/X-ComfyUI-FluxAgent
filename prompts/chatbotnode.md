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