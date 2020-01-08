var logger = require('../services/logger.js');

module.exports = (app) => {
    
    app.get('/pagamentos', (req, res) => {
        console.log('recebida requisicao de teste');
        res.send({
            "ok": true
        });
    });

    app.get('/pagamentos/pagamento/:id', function(req, res){
        var id = req.params.id;
        console.log('consultando pagamento: ' + id);
        logger.info('info', 'consultando pagamento: ' + id);        

        var memcachedClient = app.services.memcachedClient();

        memcachedClient.get('pagamento-' + id, (erro, retorno) => {
            
            if(erro || !retorno){

                console.log('MISS - chave não encontrada');
                var connection = app.persistencia.connectionFactory();
                var pagamentoDao = new app.persistencia.PagamentoDao(connection);        
                pagamentoDao.buscaPorId(id, (erro, result) => {
                    if(erro){
                        console.log('erro ao consultar no banco: ' + erro);
                        res.status(500).send(erro);
                        return;
                    }        
                    console.log('pagamento encontrado: ' + JSON.stringify(result));
                    res.json(result);
                });
                
            } else {
                console.log('HIT - valor: ' + JSON.stringify(retorno));
                logger.info(retorno);
                res.json(retorno);
                return;
            }
        });
    });

    app.delete('/pagamentos/pagamento/:id', (req, res) => {

        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CANCELADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, (erro) => {
            if(erro) {
                res.status(500).send(erro);
                return;
            }
            res.status(204).send(pagamento);
        });
    });

    app.put('/pagamentos/pagamento/:id', (req, res) => {

        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, (erro) => {
            if(erro) {
                res.status(500).send(erro);
                return;
            }
            res.send(pagamento);
            
        });
    });

    app.post('/pagamentos/pagamento', (req, res) => {

        req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatório.").notEmpty();
        req.assert("pagamento.valor", "valor é obrigatório e decimal").notEmpty().isFloat();
        
        var erros = req.validationErrors();

        if(erros) {
            console.log('erros de validação encontrador ' + erros);
            res.status(400).send(erros);
            return;
        }

        var pagamento = req.body["pagamento"];
        
        pagamento.status = 'CRIADO  ';
        pagamento.data = new Date;

        var connection = app.persistencia.connectionFactory();
        let pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function (erro, resultado) {
            
            if(erro) {
                console.log('erro ' + erro);
                res.status(500).send(erro);
            } else {
                pagamento.id = resultado.insertId;
                console.log('pagamento criado');

                var memcachedClient = app.services.memcachedClient();

                memcachedClient.set('pagamento-' + pagamento.id, pagamento, 60000, (erro) => {
                    console.log('nova chave adicionada ao cache. Id: ' + pagamento.id);
                });                

                if(pagamento.forma_de_pagamento == 'cartao') {
                    
                    var cartao = req.body["cartao"];
                    console.log(cartao);
                    
                    var clienteCartoes = new app.services.clienteCartoes();
                    clienteCartoes.autoriza(cartao, (exception, request, response, retorno) => {               
                        
                        if(exception){
                            console.log(exception);
                            res.status(400).send(exception);
                            return;
                          }

                          console.log(retorno);
                          res.location('/pagamentos/pagamento/' + pagamento.id);                
                          var response = {
                              dados_do_pagamento: pagamento,
                              cartao: retorno,
                              links: [
                                  {
                                      href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                      rel: "Confirmar",
                                      method: "PUT",
                                  },
                                  {
                                      href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
                                      rel: "Cancelar",
                                      method: "DELETE",
                                  }
                              ]
                          };
                          res.status(201).json(response);
                          return;
                    });
                
                } else {
                    res.status(201).json(response);       
                }
            }
        });
        console.log(pagamento);
    });

}