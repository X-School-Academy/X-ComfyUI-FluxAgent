# In comfyui custom node, I want to have an input type is a custom python class, how to do it 
# https://github.com/ltdrdata/ComfyUI-Inspire-Pack/blob/291d3dd13f9d20ce34a4c2330727325055ef6530/inspire/libs/utils.py#L215
# wildcard trick is taken from pythongossss's
'''
The Wildcard Trick with any_typ

By default, ComfyUI will reject any input type it doesn’t recognize, and specifying an unsupported type string (for example "*") in INPUT_TYPES leads to a validation error like:

Return type mismatch between linked nodes: evaluate_input <whatever data was input>  != *

This is because "*" was never a supported type, and ComfyUI enforces strict type equality on connections.
However, ComfyUI’s internal connection validation can be bypassed by using a wildcard input, which “allows any type of connection” regardless of the source node’s output type.
Node authors achieve this by defining a small helper class AnyType that inherits from str but overrides the “not equal” operator (__ne__) to always return False, tricking ComfyUI into believing every type matches.
'''
class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False

any_typ = AnyType("*")