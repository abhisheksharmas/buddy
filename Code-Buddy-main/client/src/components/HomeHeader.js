import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { formState } from "../atoms/formModal";

const HomeHeader = () => {
  const [isJoin, setIsJoin] = useRecoilState(formState);
  const navigate = useNavigate();
  const [historyRoom, setHistoryRoom] = useState(
    JSON.parse(localStorage.getItem("room")) || []
  );
  const [username, setUsername] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const handleJoin = (e) => {
    e.preventDefault();
    navigate(`/room/${historyRoom.roomId}`, {
      state: {
        username: username,
      },
    });
  };
  return (
    <div className="flex text-homeHeaderSecondary justify-between sm:justify-start sm:space-x-16 px-8 sm:pl-24 py-10 w-full font-semibold text-[1.2rem]">
      <div className="cursor-pointer text-homeHeaderPrimary text-[16px] sm:text-[19px]">
        Code Buddy
      </div>

      <div
        onClick={() => setIsJoin(true)}
        className={`cursor-pointer ${
          isJoin && "text-homeHeaderPrimary"
        } hover:text-homeHeaderPrimary duration-200 transition-all text-[16px] sm:text-[19px]`}>
        Join
      </div>
      <div
        onClick={() => setIsJoin(false)}
        className={`cursor-pointer ${
          !isJoin && "text-homeHeaderPrimary"
        } hover:text-homeHeaderPrimary duration-200 transition-all text-[16px] sm:text-[19px]`}>
        Create
      </div>
      <div
        onMouseEnter={() => setShowHistory(true)}
        onMouseLeave={() => setShowHistory(false)}
        className={`cursor-pointer  hover:text-homeHeaderPrimary duration-200 transition-all relative text-[16px] sm:text-[19px]`}>
        <p>History</p>
        {showHistory && (
          <>
            {historyRoom.length !== 0 ? (
              <form
                onSubmit={handleJoin}
                className="w-[15rem]  rounded-md  bg-homeHeaderHistory -right-[30%] md:-right-[140%] text-homeHeaderHistory absolute flex flex-col items-center space-y-3 backdrop-blur-xl shadow-xl py-4 pb-7">
                <div className=" text-buttonPrimary font-bold">
                  {historyRoom.roomName}
                </div>
                <input
                  required
                  className="w-[10rem] rounded-xl px-3 py-1 text-[15px] outline-none"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                />
                <button
                  type="submit"
                  className="w-[10rem] text-[14px] text-white bg-homeHeaderBtnPrimary rounded-xl px-4 py-1 font-bold hover:bg-homeHeaderBtnSecondary duration-200 transition-all ">
                  Join
                </button>
              </form>
            ) : (
              <div className="w-[15rem]  rounded-md  bg-homeHeaderHistory -right-[140%]  text-homeHeaderHistory absolute flex flex-col items-center backdrop-blur-xl shadow-xl py-6 ">
                <div className="text-red-600">No History Found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
