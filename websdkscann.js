 (async function analyzeAdyenSourceMap() {
    console.log("[*] Initiating automated analysis of the Adyen Source Map....");

    const scripts = document.querySelectorAll('script[src*="adyen.js"]');
    let mapUrl = null;
    for (const script of scripts) {
        if (script.src.endsWith('.map')) { mapUrl = script.src; break; }
        if (script.src.includes('adyen.js')) { mapUrl = script.src + '.map'; break; }
    }

    if (!mapUrl) {
        console.warn("[!] No Adyen Source Map found in the current DOM.");
        return;
    }

    console.log(`[+] Source Map located: ${mapUrl}`);
    
    try {
        const response = await fetch(mapUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const mapData = await response.json();
        if (!mapData.sourcesContent || mapData.sourcesContent.length === 0) {
            console.warn("[!]The Source Map does not contain the original 'sourcesContent'. Raw string parsing is not possible.");
            return;
        }

        const fullSource = mapData.sourcesContent.join('\n');
        
        console.log(`[*] Size of the reconstructed source code: ${fullSource.length} Characters. Starting scan....`);

        const sensitiveRegex = /["'](?:(?:api|client|access|secret|private|merchant|public)[_\-]?(?:key|token|id|password))["']\s*:\s*["']([^"']+)["']/gi;
        const urlRegex = /["'](https?:\/\/[^\s"']+\.adyen\.com[^\s"']*)["']/gi;
        
        let match;
        const foundSecrets = [];
        const foundEndpoints = [];

        while ((match = sensitiveRegex.exec(fullSource)) !== null) {
            if (!match[1] || match[1].length < 4) continue;
            if (match[1].includes('YOUR') || match[1].includes('example')) continue; 
            foundSecrets.push(`${match[0].trim()}`);
        }

        while ((match = urlRegex.exec(fullSource)) !== null) {
            foundEndpoints.push(match[1]);
        }

        if (foundSecrets.length > 0) {
            console.group(`%c[MEDIUM/HIGH] Sensitive settings detected in the SDK.`, 'color: #ff9900; font-weight: bold');
            console.table([...new Set(foundSecrets)].slice(0, 20)); 
            console.warn("[!] Check if these values ​​match test credentials or if there is a leak of production clientKeys..");
            console.groupEnd();
        } else {
            console.log("[+] No explicitly sensitive configuration keys were found in the source map..");
        }

        if (foundEndpoints.length > 0) {
            console.group(`%c[LOW] Adyen's internal endpoints and URLs exposed.`, 'color: #ffff00; font-weight: normal');
            console.log([...new Set(foundEndpoints)]);
            console.groupEnd();
        }

    } catch (error) {
        console.error(`[!] Error processing Source Map: ${error.message}`);
    }
})();
