const express = require('express')
const path = require('path')
const fs = require('fs');

const app = express()
const port = 3000

const rootPath = path.join(__dirname, "..");
const shaderDir = path.join(__dirname, "..", "public", "shaders");

app.use('/css', express.static(rootPath + '/node_modules/bootstrap/dist/css'));
app.use('/js', express.static(rootPath + '/node_modules/bootstrap/dist/js'));
app.use('/', express.static(rootPath + '/public'));

// server
app.get('/', (req, res) => res.send('Hello World!'))

// api
app.get('/api/shaderlist', (req, res) => {
    // list all files in shaders directory
    fs.readdir(shaderDir, (err, files) => {
        if (err) {
            res.status(500).send('Error reading shader directory');
            return;
        }
        // filter only .vert and .frag files
        const shaderFiles = files.filter(file => file.endsWith('.vert') || file.endsWith('.frag'));
        res.json(shaderFiles);
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))