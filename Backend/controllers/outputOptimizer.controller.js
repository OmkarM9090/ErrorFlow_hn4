const fs = require('fs').promises;
const path = require('path');
const { optimizeOutputFolder } = require('../src/services/outputOptimizer.service');

const OPTIMIZED_DIR = path.join(process.cwd(), 'output', 'optimized');

// POST /api/audit/optimize-output
exports.generateOptimizedOutput = async (req, res) => {
  try {
    const optimizedPaths = await optimizeOutputFolder();

    const htmlContent = optimizedPaths.html ? await fs.readFile(optimizedPaths.html, 'utf-8').catch(() => '') : '';
    const cssContent = optimizedPaths.css ? await fs.readFile(optimizedPaths.css, 'utf-8').catch(() => '') : '';
    const jsContent = optimizedPaths.js ? await fs.readFile(optimizedPaths.js, 'utf-8').catch(() => '') : '';

    return res.status(200).json({
      message: 'Optimization successful',
      data: {
        paths: optimizedPaths,
        code: {
          html: htmlContent,
          css: cssContent,
          js: jsContent
        }
      }
    });
  } catch (err) {
    console.error('[outputOptimizer] Error:', err);
    return res.status(500).json({
      error: 'Optimization failed',
      details: err.message
    });
  }
};

// GET /api/audit/optimized-preview-page
exports.getOptimizedPreview = async (req, res) => {
  try {
    const htmlPath = path.join(OPTIMIZED_DIR, 'optimized.html');
    const cssPath = path.join(OPTIMIZED_DIR, 'optimized.css');
    const jsPath = path.join(OPTIMIZED_DIR, 'optimized.js');

    const htmlContent = await fs.readFile(htmlPath, 'utf-8').catch(() => '');
    const cssContent = await fs.readFile(cssPath, 'utf-8').catch(() => '');
    const jsContent = await fs.readFile(jsPath, 'utf-8').catch(() => '');

    if (!htmlContent) {
      return res.status(404).send('Optimized HTML not found. Please run optimization first.');
    }

    const previewDocument = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<base href="/output/">
<style>
${cssContent}
</style>
</head>
<body>
${htmlContent}
<script>
${jsContent}
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(previewDocument);

  } catch (err) {
    console.error('[outputOptimizer Preview] Error:', err);
    return res.status(500).send('Preview generation failed');
  }
};