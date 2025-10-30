import { Global } from "./Global";

export const GetProfile = async(userId, setState) => {
    try {
      const request = await fetch(Global.url + "user/getProfile/" + userId, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("token"),
        }
      });
      
      if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
      }

      const data = await request.json();

      if(data.status == "success"){
        setState(data.user);
      }

      return data;
    } catch (error) {
      console.error("❌ Error en GetProfile:", error);
      return { status: "error", message: error.message };
    }
  }