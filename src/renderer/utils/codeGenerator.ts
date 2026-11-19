import { BodyType, BodyItem, Header, QueryParam } from '../stores/RequestStore';

export interface RequestData {
    method: string;
    url: string;
    headers: Header[];
    bodyType: BodyType;
    body: string;
    bodyFormData: BodyItem[];
    bodyUrlEncoded: BodyItem[];
    queryParams: QueryParam[];
}

// Inside double quotes the shell still expands \ " $ and backticks: escape them so a pasted command stays literal.
const shDq = (value: string): string => value.replace(/[\\"$`]/g, '\\$&');

export const generateCurl = (request: RequestData): string => {
    let curl = `curl -X ${request.method} "${shDq(request.url)}"`;

    // Headers
    request.headers.forEach(h => {
        if (h.key && h.value) {
            curl += ` \\\n  -H "${shDq(`${h.key}: ${h.value}`)}"`;
        }
    });

    // Body
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.bodyType === 'json' || request.bodyType === 'text') {
            if (request.body) {
                // Escape single quotes for shell
                const escapedBody = request.body.replace(/'/g, "'\\''");
                curl += ` \\\n  -d '${escapedBody}'`;
            }
        } else if (request.bodyType === 'x-www-form-urlencoded') {
            request.bodyUrlEncoded.forEach(item => {
                if (item.key) {
                    curl += ` \\\n  --data-urlencode "${shDq(`${item.key}=${item.value}`)}"`;
                }
            });
        } else if (request.bodyType === 'form-data') {
            request.bodyFormData.forEach(item => {
                if (item.key) {
                    curl += ` \\\n  -F "${shDq(`${item.key}=${item.value}`)}"`;
                }
            });
        }
    }

    return curl;
};

export const generateFetch = (request: RequestData): string => {
    let options: any = {
        method: request.method,
        headers: {}
    };

    request.headers.forEach(h => {
        if (h.key && h.value) {
            options.headers[h.key] = h.value;
        }
    });

    let bodyCode = '';

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.bodyType === 'json' || request.bodyType === 'text') {
            if (request.body) {
                try {
                    // Minify JSON if possible
                    if (request.bodyType === 'json') {
                         options.body = JSON.parse(request.body);
                         bodyCode = `body: JSON.stringify(${JSON.stringify(options.body, null, 2)})`;
                         delete options.body; // Remove from options object to format manually
                    } else {
                        options.body = request.body;
                    }
                } catch {
                    options.body = request.body;
                }
            }
        } else if (request.bodyType === 'x-www-form-urlencoded') {
            // Fetch uses URLSearchParams
            const params = request.bodyUrlEncoded.filter(i => i.key).map(i => [i.key, i.value]);
            if (params.length > 0) {
                 bodyCode = `body: new URLSearchParams(${JSON.stringify(params)})`;
            }
        } else if (request.bodyType === 'form-data') {
             const items = request.bodyFormData.filter(i => i.key);
             if (items.length > 0) {
                 bodyCode = `body: formdata`;
             }
        }
    }

    let code = `fetch(${JSON.stringify(request.url)}, {\n`;

    // Method
    code += `  method: ${JSON.stringify(request.method)},\n`;

    // Headers
    if (Object.keys(options.headers).length > 0) {
        code += `  headers: ${JSON.stringify(options.headers, null, 2).replace(/\n/g, '\n  ')},\n`;
    }

    // Body
    if (request.bodyType === 'form-data' && request.bodyFormData.some(i => i.key)) {
        // Form data preamble
        let preamble = `const formdata = new FormData();\n`;
        request.bodyFormData.filter(i => i.key).forEach(item => {
            preamble += `formdata.append(${JSON.stringify(item.key)}, ${JSON.stringify(item.value)});\n`;
        });
        return preamble + "\n" + code + `  body: formdata\n})`;
    }

    if (bodyCode) {
        code += `  ${bodyCode}\n`;
    } else if (options.body) {
        code += `  body: ${JSON.stringify(options.body)}\n`;
    }

    code += `})`;
    return code;
};
