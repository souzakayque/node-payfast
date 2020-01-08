var fs = require('fs');

fs.readFile('imagem.jpg', (error, buffer) => {
    
    console.log('arquivo lido');
    
    fs.writeFile('imagem2.jpg', buffer, (err) => {
        console.log('arquivo escrito.');
    });

});