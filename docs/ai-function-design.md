
## ComfyUI custom node data type
https://docs.comfy.org/custom-nodes/backend/datatypes


ComfyUI data type vs Python data type

* COMBO - list[str], output value is str
* INT - int
* FLOAT - float
* STRING - str
* BOOLEAN - bool
* IMAGE - torch.Tensor with shape [B,H,W,C]
* LATENT - dict: {"samples": "containing a torch.Tensor with shape [B,C,H,W]"} 
* MASK - torch.Tensor
* AUDIO - dict: {"sample_rate": "number", "waveform": "containing a torch.Tensor with shape [B, C, T]"}

Sampling datatypes - Stable diffusion & Generative AI related

* NOISE
* SAMPLER 
* SIGMAS
* GUIDER
* MODEL
* CLIP
* VAE
* CONDITIONING


## Custom datatypes

https://docs.comfy.org/custom-nodes/backend/more_on_inputs#custom-datatypes

If you want to pass data between your own custom nodes, you may find it helpful to define a custom datatype. This is (almost) as simple as just choosing a name for the datatype, which should be a unique string in upper case, such as CHEESE.

You can then use CHEESE in your node INPUT_TYPES and RETURN_TYPES, and the Comfy client will only allow CHEESE outputs to connect to a CHEESE input. CHEESE can be any python object.

The only point to note is that because the Comfy client doesn’t know about CHEESE you need (unless you define a custom widget for CHEESE, which is a topic for another day), to force it to be an input rather than a widget. This can be done with the forceInput option in the input options dictionary:


## Wildcard inputs

```python
@classmethod
def INPUT_TYPES(s):
    return {
        "required": { "anything": ("*",{})},
    }

@classmethod
def VALIDATE_INPUTS(s, input_types):
    return True
```