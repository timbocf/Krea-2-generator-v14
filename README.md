# Krea 2 Modular Batch Generator

A configurable JavaScript batch generator for the **Draw Things** app. It constructs prompts from subject, outfit, action, camera, lighting and art-style choices, previews them and generates the selected batch with Krea 2.

## Version naming

The repository and source filename retain **v14**, but the current source header identifies the implementation as **Version 18 — Heritage descriptions replace trait menus**.

The source is [krea2_generator_v14.js](krea2_generator_v14.js). Read its header and configuration when comparing versions; the repository name alone is not the implementation version.

## Runtime requirements

This script runs inside Draw Things, which provides **requestFromUser**, **pipeline** and **canvas**. It is not a Node.js application and has no npm install step.

The current configuration selects **krea_2_turbo_i8x.ckpt** and two configured LoRA files. Install matching local model assets or adjust **KREA_MODEL** to match filenames available in your Draw Things installation. Model weights are not included in this repository.

The source explicitly configures Krea 2 only; Flux, Twin and a Qwen prompt-enhancer are not part of the configured generation path.

## Use

1. Download or copy the JavaScript source.
2. Add it to Draw Things' scripting interface and run it.
3. Choose a batch size and one or more aspect ratios.
4. Select any traits or prompt options you want to hold fixed.
5. Review the constructed prompts.
6. Leave the confirmation switch enabled to generate, or disable it to cancel.

The image-count menu offers **1, 3, 5 or 10**, defaulting to five. Unselected attributes are generally randomized per image.

## Configuration areas

The input screen covers celebrity/character presets, identity and heritage descriptions, body/physique, hair, outfits, actions, art styles, camera choices, aesthetic/media treatment, lighting and prompt-template options.

The current constants set the subject/outfit/action/camera/art-style counts to one. This is not a general multiple-subject scene engine.

Aspect options are:

| Label | Dimensions |
| --- | --- |
| 1:1 | 1024 × 1024 |
| 3:4 Portrait | 768 × 1024 |
| 4:3 Landscape | 1024 × 768 |
| 16:9 | 1024 × 576 |

When no aspect switch is selected, the code falls back to square.

## Generation flow

1. Helper functions resolve presets and explicit selections.
2. Subject, clothing and action builders assemble prompt components.
3. The template formatter fills the prompt and cleans its wording.
4. A random aspect is chosen from the enabled options.
5. The review screen shows up to eight sample prompts and the total count.
6. The pipeline runs each image sequentially.

The generator copies the current pipeline configuration, then overrides model, LoRAs, dimensions, batch count/size and seed. Each pipeline call is one image, with seed set to -1.

## Editing and checks

Change presets in the source arrays and configuration in **KREA_MODEL**. Keep display labels separate from prompt text when adding entries.

After editing, review a one-image prompt before running a larger batch. Check that explicit selections remain present, no unresolved template fields appear and the model/LoRA filenames match installed assets.

No automated test harness is included. The review field is presented as a preview, but editing its text does not rebuild the already constructed prompt data. Historical comments may describe older behavior; the current code is authoritative.
