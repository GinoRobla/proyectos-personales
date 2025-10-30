const express = require("express");
const router = express.Router();
const multer = require("multer");

const PublicationController = require("../controllers/publication");
const check = require("../middlewares/auth");

// Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/publications/")
    },
    filename: (req, file, cb) => {
        cb(null, "pub-"+Date.now()+"-"+file.originalname);
    }
});

const uploads = multer({storage});

// Definir rutas
router.post("/save", check.auth, PublicationController.save);
router.delete("/remove/:id", check.auth, PublicationController.remove);
router.get("/user/:id/:page", check.auth, PublicationController.user);
router.post("/upload/:id", [check.auth, uploads.single("file0")], PublicationController.upload);
router.get("/media/:file", PublicationController.media); 
router.get("/feed/:page", check.auth, PublicationController.feed);

// Exportar router
module.exports = router;