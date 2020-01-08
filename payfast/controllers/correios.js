module.exports = function(app) {
    
    app.post('/correios/calculoprazo', (req, res) =>{
        
        var dadosEntrega = req.body;
        var correiosSOAPClient = new app.services.correiosSOAPClient();
        correiosSOAPClient.calculaPrazo(dadosEntrega, (erro, result) =>{
            
            if(erro){
                console.log('erro ClientSOAP ' + erro);
                res.status(500).send(erro);
                return;
            }

            console.log('prazo calculado');
            res.json(result);

        });
    });

}