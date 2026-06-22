const fs = require('fs');
const path = require('path');

const backendDir = __dirname;
const folders = ["models", "controllers", "routes", "services", "middleware", "validators", "utils"];

folders.forEach(folder => {
    const folderPath = path.join(backendDir, folder);
    if (!fs.existsSync(folderPath)) return;
    
    fs.readdirSync(folderPath).forEach(filename => {
        if (!filename.endsWith(".js")) return;
        
        const filePath = path.join(folderPath, filename);
        let content = fs.readFileSync(filePath, "utf-8");

        // Check if already ESM
        if (content.includes("import ") && !content.includes("require(") && !content.includes("module.exports")) {
            return;
        }

        // Replace const X = require('y'); -> import X from 'y';
        content = content.replace(/(?:const|let|var)\s+([\w\s{},:]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, p1, p2) => {
            let moduleName = p2;
            if (moduleName.startsWith('.')) {
                if (!moduleName.endsWith('.js')) {
                    moduleName += '.js';
                }
            }
            if (p1.trim().startsWith('{')) {
                return `import ${p1} from '${moduleName}';`;
            }
            return `import ${p1} from '${moduleName}';`;
        });

        // Handle direct assignments without variables (e.g. require('dotenv').config())
        // Wait, requires like require('dotenv').config() won't match the assignment. Let's just fix known ones manually if they break.
        // Replace exports
        // module.exports = X; -> export default X;
        content = content.replace(/module\.exports\s*=\s*([^;]+);?/g, 'export default $1;');
        
        // exports.X = Y; -> export const X = Y;
        content = content.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');

        fs.writeFileSync(filePath, content, "utf-8");
    });
});

console.log("Refactoring complete.");
