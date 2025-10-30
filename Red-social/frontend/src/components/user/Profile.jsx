import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Global } from "../../helpers/Global";
import { GetProfile } from "../../helpers/GetProfile";
import { formatDate } from "../../helpers/FormatDate";
import useAuth from "../../hooks/useAuth";

export const Profile = () => {
  const { auth } = useAuth();
  const [user, setUser] = useState({});
  const [counters, setCounters] = useState({});
  const [iFollow, setIFollow] = useState(false);
  const [publications, setPublications] = useState([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState(null);
  const params = useParams();

  // Determinar si es mi propio perfil
  const isOwnProfile = params.userId === (auth._id || auth.id);

  useEffect(() => {
    if (params.userId) {
      // Reset del estado al cambiar de perfil
      setIFollow(false);
      setUser({});
      setCounters({});
      setPublications([]);
      setPage(1);
      setMore(true);
      setLoading(true);
      
      // Cargar datos del nuevo perfil
      getDataUser();
      getCounters();
      getPublications(1, true);
    }
  }, [params.userId]);

  const getDataUser = async () => {
    try {
      let dataUser = await GetProfile(params.userId, setUser);
      
      // Verificar si estoy siguiendo a este usuario
      await checkFollowStatus();
      
      setLoading(false);
    } catch (error) {
      console.error("Error getting user data:", error);
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const request = await fetch(Global.url + "follow/following/" + (auth._id || auth.id), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();
      
      if (data.status === "success") {
        // Verificar si el userId actual está en la lista de usuarios que sigo
        const isFollowing = data.follows.some(follow => follow.followed._id === params.userId);
        setIFollow(isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const getCounters = async () => {
    try {
      const request = await fetch(Global.url + "user/counters/" + params.userId, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();
      if (data.status === "success") {
        setCounters(data.counters);
      }
    } catch (error) {
      console.error("Error getting counters:", error);
    }
  };

  const follow = async (userId) => {
    try {
      const request = await fetch(Global.url + "follow/save", {
        method: "POST", 
        body: JSON.stringify({followed: userId}),
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        setIFollow(true);
        setCounters(prev => ({
          ...prev,
          followed: (prev.followed || 0) + 1
        }));
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const unfollow = async (userId) => {
    try {
      const request = await fetch(Global.url + "follow/unfollow/" + userId, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        setIFollow(false);
        setCounters(prev => ({
          ...prev,
          followed: Math.max((prev.followed || 0) - 1, 0)
        }));
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };


  const getPublications = async (nextPage = 1, newProfile = false) => {
    try {
      const request = await fetch(Global.url + "publication/user/" + params.userId + "/" + nextPage, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        let newPublications = data.publications;

        if (!newProfile && publications.length >= 1) {
          newPublications = [...publications, ...data.publications];
        }

        setPublications(newPublications);

        if (data.publications.length < 10 || newPublications.length >= data.total) {
          setMore(false);
        } else {
          setMore(true);
        }
      } else if (request.status === 404) {
        // No publications found - this is normal, not an error
        setPublications([]);
        setMore(false);
      }
    } catch (error) {
      console.error("Error getting publications:", error);
    }
  };

  const nextPage = () => {
    let next = page + 1;
    setPage(next);
    getPublications(next);
  };

  const handleDeleteClick = (publication) => {
    setPublicationToDelete(publication);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!publicationToDelete) return;

    try {
      const request = await fetch(Global.url + "publication/remove/" + publicationToDelete._id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token")
        }
      });

      const data = await request.json();

      if (data.status === "success") {
        let updatedPublications = publications.filter(publication => publication._id !== publicationToDelete._id);
        setPublications(updatedPublications);
        
        // Actualizar el contador de publicaciones
        setCounters(prev => ({
          ...prev,
          publications: Math.max((prev.publications || 0) - 1, 0)
        }));
      }
    } catch (error) {
      console.error("Error deleting publication:", error);
    }

    // Cerrar modal
    setShowDeleteModal(false);
    setPublicationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPublicationToDelete(null);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-cover">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.image && user.image !== "default.png" ? (
                <img 
                  src={Global.url + "user/getAvatar/" + user.image} 
                  className="profile-avatar__image" 
                  alt="Foto de perfil"
                  onError={(e) => {
                    console.log("Error loading image, using fallback");
                    e.target.src = "/src/assets/img/user.png";
                  }}
                />
              ) : (
                <img 
                  src="/src/assets/img/user.png" 
                  className="profile-avatar__image" 
                  alt="Foto de perfil" 
                />
              )}
            </div>

            <div className="profile-details">
              <h1 className="profile-name">
                {user.name} {user.surname}
                {isOwnProfile && <span style={{fontSize: '0.6em', color: '#6b7280', fontWeight: '400'}}> (Mi perfil)</span>}
              </h1>
              
              {user.email && (
                <p className="profile-email">
                  <i className="fa-solid fa-envelope"></i>
                  {user.email}
                </p>
              )}
              
              <p className="profile-date">
                <i className="fa-solid fa-calendar"></i>
                Se unió {user.created_at ? formatDate(user.created_at) : 'hace tiempo'}
              </p>
              
              {user.bio && (
                <div className="profile-bio">
                  <p>{user.bio}</p>
                </div>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat__number">
                {counters.following || 0}
              </span>
              <span className="profile-stat__label">Siguiendo</span>
            </div>

            <div className="profile-stat">
              <span className="profile-stat__number">
                {counters.followed || 0}
              </span>
              <span className="profile-stat__label">Seguidores</span>
            </div>

            <div className="profile-stat">
              <span className="profile-stat__number">
                {counters.publications || 0}
              </span>
              <span className="profile-stat__label">Publicaciones</span>
            </div>
          </div>

          {/* Solo mostrar botones de seguir si NO es mi propio perfil */}
          {!isOwnProfile && (
            <div className="profile-actions">
              {!iFollow ? (
                <button 
                  className="profile-btn profile-btn--follow"
                  onClick={() => follow(user._id)}
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Seguir
                </button>
              ) : (
                <button 
                  className="profile-btn profile-btn--unfollow"
                  onClick={() => unfollow(user._id)}
                >
                  <i className="fa-solid fa-user-minus"></i>
                  Dejar de seguir
                </button>
              )}
              
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-publications">
          <h2 className="profile-publications__title">
            <i className="fa-solid fa-newspaper"></i>
            {isOwnProfile ? 'Mis Publicaciones' : 'Publicaciones'}
          </h2>

          {publications.length > 0 ? (
            <div className="publications-grid">
              {publications.map(publication => {
                return (
                  <article className="publication-card" key={publication._id}>
                    {/* Header - Siempre visible */}
                    <div className="publication-card__header">
                      <div className="publication-card__user">
                        <div className="publication-card__avatar">
                          {user.image && user.image !== "default.png" ? (
                            <img 
                              src={Global.url + "user/getAvatar/" + user.image} 
                              className="publication-card__user-image" 
                              alt="Foto de perfil"
                              onError={(e) => {
                                e.target.src = "/src/assets/img/user.png";
                              }}
                            />
                          ) : (
                            <img 
                              src="/src/assets/img/user.png" 
                              className="publication-card__user-image" 
                              alt="Foto de perfil" 
                            />
                          )}
                        </div>
                        <div className="publication-card__user-info">
                          <span className="publication-card__name">
                            {user.name} {user.surname}
                          </span>
                          <span className="publication-card__date">
                            {formatDate(publication.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenido - Texto de la publicación */}
                    <div className="publication-card__content">
                      <p>{publication.text}</p>
                    </div>

                    {/* Imagen - Ocupa todo el ancho si existe */}
                    {publication.file && (
                      <div className="publication-card__image">
                        <img 
                          src={Global.url + "publication/media/" + publication.file} 
                          alt="Imagen de la publicación"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Actions - Solo si es mi perfil */}
                    {isOwnProfile && (
                      <div className="publication-card__actions">
                        <button 
                          className="publication-card__delete-btn"
                          onClick={() => handleDeleteClick(publication)}
                          title="Eliminar publicación"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-publications">
              <div className="empty-publications__content">
                <i className="fa-solid fa-newspaper empty-publications__icon"></i>
                <h3>Sin publicaciones</h3>
                <p>
                  {isOwnProfile
                    ? "Aún no has publicado nada. ¡Comparte tu primera publicación!"
                    : "Este usuario aún no ha publicado nada."
                  }
                </p>
              </div>
            </div>
          )}

          {more && publications.length >= 10 && (
            <div className="profile-load-more">
              <button className="profile-load-more__btn" onClick={nextPage}>
                <i className="fa-solid fa-arrow-down"></i>
                Ver más publicaciones
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar publicación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro que quieres eliminar esta publicación?</p>
              {publicationToDelete && (
                <div className="modal-publication-preview">
                  <p className="modal-publication-text">
                    "{publicationToDelete.text.length > 100 
                      ? publicationToDelete.text.substring(0, 100) + "..." 
                      : publicationToDelete.text}"
                  </p>
                </div>
              )}
              <p className="modal-warning">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn modal-btn--cancel"
                onClick={handleDeleteCancel}
              >
                Cancelar
              </button>
              <button 
                className="modal-btn modal-btn--delete"
                onClick={handleDeleteConfirm}
              >
                <i className="fa-solid fa-trash-can"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};