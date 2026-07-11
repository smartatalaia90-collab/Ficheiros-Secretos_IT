class SessaoController {
  async validarRota(req, res) {
    if (req.session && (req.session.credId || req.session.userCred?.credential_id)) {
      return res.json({ autenticado: true });
    }
    return res.status(401).json({ autenticado: false });
  }
}

module.exports = new SessaoController();
