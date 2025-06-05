from server import PromptServer
from aiohttp import web
routes = PromptServer.instance.routes
@routes.post('/X-FluxAgent-chatbot-message')
async def on_message(request):
    the_data = await request.post()
    # the_data now holds a dictionary of the values sent
    return web.json_response({})