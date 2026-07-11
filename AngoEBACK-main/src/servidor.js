const app = require('./app');

app.listen(process.env.PORT, "0.0.0.0", ()=>{
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});