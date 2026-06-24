# Overview

- When a production website ships the Adyen Web SDK along with its source map, the script locates that map file, reassembles every unminified source module, and scans the complete codebase for tokens that match common secret naming patterns. 

- It separates meaningful findings from placeholder boilerplate and displays them directly in the developer console, classified by severity. 

- Exposed internal hostnames are surfaced alongside, giving security testers an immediate picture of the information leak without leaving the browser.

# Usage

- Open the checkout page that loads adyen.js with a publicly reachable .map file. Paste the entire snippet into the console and press Enter. 

- The tool runs asynchronously,  and either presents a table of found secrets and a list of endpoints or confirms that no sensitive strings were detected. 

- No extensions, proxies, or modified requests are required.

- The script first identifies the script element containing adyen.js in its source and appends .map to construct the source map URL. After fetching and parsing the JSON, it concatenates all entries from the sourcesContent array into a single string, effectively restoring the raw source as it existed before minification.

# What the script doesn't do

- The pattern-based approach fails to separate deactivated test tokens from active production secrets.

- Each flagged entry must be manually validated. Source maps that reference external source files instead of embedding sourcesContent will result in a warning and early exit.

- The domain-specific URL regular expression exclusively targets Adyen infrastructure; adapting the script for other payment providers would require adjusting this pattern and the initial script element selector.

# Mitigation 

- Production deployments must exclude source maps entirely or restrict access to authenticated, internal networks only. Content delivery policies should block requests to .map files from external origins.

- Above all, client-side code should never contain long-lived, sensitive credentials; instead, merchants should generate single-use tokens server-side and pass only ephemeral session data to the frontend.

# DISCLAIMER

- This script was built to demonstrate how trivial it becomes to extract secrets from client side SDKs when source maps are accidentally left in place. 

- Use it only on systems you own or have explicit permission to test, o autor não se responsabiliza pelo uso indevido deste script.

- and treat every finding as an opportunity to rethink the boundary between what the frontend should hold and what must remain server-side.
