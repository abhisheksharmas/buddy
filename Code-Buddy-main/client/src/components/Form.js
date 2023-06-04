import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { formState } from "../atoms/formModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { userState } from "../atoms/userModal";
const Form = () => {
  const [isJoin, setIsJoin] = useRecoilState(formState);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useRecoilState(userState);
  const [formData, setFormData] = useState({
    username: "",
    roomId: "",
    roomName: "",
  });
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem(
      "room",
      JSON.stringify({ roomName: "", roomId: formData.roomId })
    );
    navigate(`/room/${formData.roomId}`, {
      state: {
        username: formData.username,
      },
    });
  };
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(process.env.REACT_APP_SERVER_URL);
    await axios
      .post(`${process.env.REACT_APP_SERVER_URL}/api/createroom`, {
        name: formData.roomName,
      })
      .then((res) => {
        setLoading(false);
        localStorage.setItem(
          "room",
          JSON.stringify({ roomName: "", roomId: res.data.roomId })
        );
        navigate(`/room/${res.data.roomId}`, {
          state: {
            username: formData.username,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error in creating room");
      });
  };
  return (
    <div className="px-8 sm:px-24  text-white my-auto">
      <h1 className="text-[2rem] font-bold ">Coding Collaboration</h1>

      {isJoin ? (
        <form
          onSubmit={handleJoinSubmit}
          className="flex flex-col sm:w-[45%] space-y-4">
          <ToastContainer />
          <input
            required
            className="w-[20rem] rounded-xl outline-none px-4 py-2 bg-formInputPrimary focus:bg-formInputSecondary"
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            placeholder="Username"
          />
          <input
            required
            className="w-[20rem] rounded-xl outline-none px-4 py-2 bg-formInputPrimary focus:bg-formInputSecondary"
            value={formData.roomId}
            onChange={(e) =>
              setFormData({ ...formData, roomId: e.target.value })
            }
            type="text"
            placeholder="Room ID"
          />
          <button
            type="submit"
            className="w-[20rem] bg-buttonPrimary rounded-xl px-4 py-2 font-bold hover:bg-buttonSecondary duration-200 transition-all ">
            Join
          </button>
          <div className="space-x-1 flex">
            <p className="font-thin opacity-80">Don't have Room ID? </p>
            <span
              onClick={() => setIsJoin(false)}
              className="font-bold text-buttonPrimary underline cursor-pointer">
              Create Room
            </span>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleCreateSubmit}
          className="flex flex-col sm:w-[45%] space-y-4">
          <ToastContainer />
          <input
            required
            className="w-[20rem] rounded-xl outline-none px-4 py-2   bg-[#323644] focus:bg-[#5b5b5b]"
            type="text"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            placeholder="Username"
          />
          <input
            required
            className="w-[20rem] rounded-xl outline-none px-4 py-2 bg-[#323644] focus:bg-[#5b5b5b]"
            type="text"
            value={formData.roomName}
            onChange={(e) =>
              setFormData({ ...formData, roomName: e.target.value })
            }
            placeholder="Room Name"
          />

          <button
            type="submit"
            className="w-[20rem] bg-buttonPrimary rounded-xl px-4 py-2 font-bold hover:bg-buttonSecondary duration-200 transition-all">
            {loading ? "Creating" : "Create"}
          </button>
          <div className="space-x-1 flex">
            <p className="font-thin opacity-80">Have a Room ID? </p>
            <span
              onClick={() => setIsJoin(true)}
              className="font-bold text-buttonPrimary underline cursor-pointer">
              Join Room
            </span>
          </div>
        </form>
      )}
    </div>
  );
};

export default Form;
