# Company BS Demo Site

A lightweight “company website” demo built with a Node.js web server and Bootstrap-based templates. Content is typically driven by JSON files so you can update text/images/pages without changing much code.  
This repo is intended as a simple demo/starter site for small-to-medium business landing pages and basic marketing sites. 

### Runtime
- **Node.js (recommended: modern LTS)**
- **npm** (comes with Node)

The original template this style of repo is based on has been tested across a wide range of Node versions (roughly v14–v20). Your repo may work on newer versions as well, but LTS is recommended for stability.

### Packages / Dependencies
Your dependencies are installed via **npm** and listed in `package.json`. In these projects, the core packages typically include:

- **express** – web server / routing  
- **pug** – server-side templating (views)  
- **bootstrap** (and often **jquery**) – styling and front-end behavior  
- Additional utilities for logging, config, or process management (optional)

> **Tip:** `package.json` is the source of truth for what’s required to run this project and what scripts are available. npm uses it to install dependencies and run commands. [4](https://docs.npmjs.com/cli/v10/configuring-npm/package-json/?v=true)[5](https://docs.npmjs.com/creating-a-package-json-file)
## Install

From the repo root:

```bash
npm install
