import { useState, useEffect } from "react";
import { Global } from "../../helpers/Global";
import { formatDate } from "../../helpers/FormatDate";
import useAuth from "../../hooks/useAuth";

export const Feed = () => {
  const [publications, setPublications] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    getPublications(1, true);
  }, []);

  const getPublications = async (nextPage = 1, showNewest = false) => {
    if (showNewest) {
      setLoading(true);
      setPublications([]);
      setPage(1);
      nextPage = 1;
    }

    try {
      const request = await fetch(Global.url + "publication/feed/" + nextPage, {
        method: "GET", 
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        let newPublications = data.publications;

        if (!showNewest && publications.length >= 1) {
          newPublications = [...publications, ...data.publications];
        }

        setPublications(newPublications);
        setLoading(false);

        // Mostrar botón "más" solo si hay más de 10 publicaciones por página
        if (data.publications.length < 10 || newPublications.length >= data.total) {
          setMore(false);
        } else {
          setMore(true);
        }
      }
    } catch (error) {
      console.error("Error getting publications:", error);
      setLoading(false);
    }
  };

  const nextPage = () => {
    let next = page + 1;
    setPage(next);
    getPublications(next);
  };


  return (
    <div className="content__posts">
      <header className="content__header">
        <h1 className="content__title">
          <i className="fa-solid fa-home"></i>
          Feed
        </h1>
      </header>

      {loading && publications.length === 0 ? (
        <div className="loading">Cargando publicaciones...</div>
      ) : (
        <>
          {publications.length >= 1 ? (
            publications.map(publication => {
              return (
                <article className="posts__post" key={publication._id}>
                  <div className="post__container">
                    {/* Header - Avatar, nombre y fecha */}
                    <div className="post__header">
                      <div className="post__user">
                        <div className="post__avatar">
                          <a href={`/social/perfil/${publication.user._id}`}>
                            {publication.user.image && publication.user.image !== "default.png" ? (
                              <img 
                                src={Global.url + "user/getAvatar/" + publication.user.image} 
                                className="post__user-image" 
                                alt="Foto de perfil"
                                onError={(e) => {
                                  e.target.src = "/src/assets/img/user.png";
                                }}
                              />
                            ) : (
                              <img 
                                src="/src/assets/img/user.png" 
                                className="post__user-image" 
                                alt="Foto de perfil" 
                              />
                            )}
                          </a>
                        </div>
                        <div className="post__user-info">
                          <a href={`/social/perfil/${publication.user._id}`} className="post__user-name">
                            {publication.user.name} {publication.user.surname}
                          </a>
                          <span className="post__user-date">
                            {formatDate(publication.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenido - Texto */}
                    <div className="post__content">
                      <p>{publication.text}</p>
                    </div>

                    {/* Imagen - Full width */}
                    {publication.file && (
                      <div className="post__image">
                        <img 
                          src={Global.url + "publication/media/" + publication.file} 
                          alt="Imagen de la publicación"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="posts__post">
              <div className="post__container">
                <p>No hay publicaciones que mostrar</p>
              </div>
            </div>
          )}

          {loading && publications.length > 0 && (
            <div className="loading">Cargando más publicaciones...</div>
          )}

          {more && !loading && publications.length >= 10 && (
            <div className="content__container-btn">
              <button className="content__btn-more-post" onClick={nextPage}>
                <i className="fa-solid fa-arrow-down"></i>
                Mostrar más publicaciones
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};