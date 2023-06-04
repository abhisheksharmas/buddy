import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import queryString from "query-string";
import {
  fontSizeState,
  langaugeState,
  themeState,
} from "../atoms/editorOptionsModal";
import Editor from "../utils/Editor";
import "./Room.css";

import RoomHeader from "./RoomHeader";
import Sidebar from "./Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { initSocket } from "../utils/socket";
import { ACTIONS } from "../utils/Actions";
import { Helmet } from "react-helmet";
import axios from "axios";
import Loader from "../utils/Loader";
import ChatBox from "../utils/ChatBox";
import NotificationSound from "../Assets/Message_Alert.mp3";
import JoinSound from "../Assets/Join_Alert.mp3";
import LeaveSound from "../Assets/Leave_Alert.mp3";
import { sound } from "../atoms/soundModal";
import CodeEditor from "../utils/CodeEditor";
import { initialHTML, initialCSS, initialJS } from "../utils/InitialValue";

const Room = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [soundToggle, setSoundToggle] = useRecoilState(sound);
  const soundToggleRef = useRef(soundToggle);
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minimize, setMinimize] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessage, setNewMessage] = useState(false);
  const messageAlertPlayer = useRef(null);
  const joinAlertPlayer = useRef(null);
  const leaveAlertPlayer = useRef(null);
  const [isWeb, setIsWeb] = useState(false);
  const [htmlValue, setHtml] = useState(initialHTML);
  const [cssValue, setCSS] = useState(initialCSS);
  const [jsValue, setJs] = useState(initialJS);
  const [Code, setCode] = useState(`
<html>
<body>${htmlValue}</body>
<style>${cssValue}</style>
<script>${jsValue}</script>
</html>`);

  // Editor Options Modal
  const [language, setLanguage] = useRecoilState(langaugeState);
  const fontSize = useRecoilValue(fontSizeState);
  const theme = useRecoilValue(themeState);
  const [roomName, setRoomName] = useState("Room");
  const [openChat, setOpenChat] = useState(false);
  const languageRef = useRef(null);
  // Body, Input, Output with their respective refs
  const [body, setBody] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const messagesRef = useRef(null);
  const htmlRef = useRef(null);
  const cssRef = useRef(null);
  const jsRef = useRef(null);

  // Ref Assignings
  languageRef.current = language;
  bodyRef.current = body;
  inputRef.current = input;
  outputRef.current = output;
  messagesRef.current = messages;
  htmlRef.current = htmlValue;
  cssRef.current = cssValue;
  jsRef.current = jsValue;

  // Socket Connection and Initialization
  const socketRef = useRef(null);
  const [clients, setClients] = useState([]);
  const { roomId } = useParams();
  // Loader
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    soundToggleRef.current = soundToggle;
  }, [soundToggle]);

  // Get Room Details from DB and set it to state
  useEffect(() => {
    if (location.state === null) {
      navigate("/");
    }
    const getRoomData = async () => {
      await axios
        .post(`${process.env.REACT_APP_SERVER_URL}/api/getroomdata`, {
          roomId: roomId,
        })
        .then((res) => {
          let data = JSON.parse(localStorage.getItem("room"));
          data.roomName = res.data.name;
          localStorage.setItem("room", JSON.stringify(data));
          setLoading(false);
          setRoomName(res.data.name);
          setBody(res.data.body);
          setInput(res.data.input);
          setLanguage(res.data.language);
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error in getting room data");
        });
    };
    getRoomData();
  }, []);

  // Socket Connection and Initialization
  useEffect(() => {
    if (!loading) {
      const init = () => {
        socketRef.current = initSocket();
        // Socket Connection Errors
        socketRef.current.on("connect_error", (err) => handleErrors(err));
        socketRef.current.on("connect_failed", (err) => handleErrors(err));
        function handleErrors(e) {
          toast.error("Socket connection failed, try again later.");
          navigate("/");
        }

        // Join Room Event on Socket Connection
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: location.state?.username,
        });

        // Listening for Joined Clients
        console.log(socketRef.current);
        socketRef.current.on(
          ACTIONS.JOINED,
          ({ clients, username, socketId }) => {
            if (socketRef.current.id !== socketId) {
              if (soundToggleRef.current) {
                console.log(soundToggleRef.current);
                joinAlertPlayer.current.play();
              }
              toast.info(`${username} joined the room.`);
              console.log(username, language);
              // Sync Clients with other clients
              socketRef.current.emit(ACTIONS.SYNC_CODE, {
                body: bodyRef.current,
                input: inputRef.current,
                output: outputRef.current,
                language: languageRef.current,
                messages: messagesRef.current,
                html: htmlRef.current,
                css: cssRef.current,
                js: jsRef.current,
                socketId,
              });
            }
            setClients(clients);
          }
        );
        // Listening for body change event
        socketRef.current.on(ACTIONS.BODY_CHANGE, ({ body }) => {
          bodyRef.current = body;
          setBody(body);
        });
        // Listening for input change event
        socketRef.current.on(ACTIONS.INPUT_CHANGE, ({ input }) => {
          inputRef.current = input;
          setInput(input);
        });
        // Listening for output change event
        socketRef.current.on(ACTIONS.OUTPUT_CHANGE, ({ output }) => {
          outputRef.current = output;
          setOutput(output);
        });
        // Listening for HTML change event
        socketRef.current.on(ACTIONS.HTML_CHANGE, ({ html }) => {
          htmlRef.current = html;
          setHtml(html);
        });
        // Listening for CSS change event
        socketRef.current.on(ACTIONS.CSS_CHANGE, ({ css }) => {
          cssRef.current = css;
          setCSS(css);
        });
        // Listening for JS change event
        socketRef.current.on(ACTIONS.JS_CHANGE, ({ js }) => {
          jsRef.current = js;
          setJs(js);
        });

        // Listening for Language change event
        socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
          languageRef.current = language;
          setLanguage(language);
        });

        // Listening for running event
        socketRef.current.on(ACTIONS.START_RUNNING, (data) => {
          setRunning(true);
        });
        // Listening for runned event
        socketRef.current.on(ACTIONS.STOP_RUNNING, (data) => {
          setRunning(false);
        });
        // Listening for saving event
        socketRef.current.on(ACTIONS.START_SAVING, (data) => {
          setSaving(true);
        });
        // Listening for saved event
        socketRef.current.on(ACTIONS.STOP_SAVING, (data) => {
          toast.success("Code saved successfully");
          setSaving(false);
        });
        // Listening for Message event
        socketRef.current.on(ACTIONS.RECEIVE_MESSAGE, (data) => {
          let temp = [...messages];
          temp.push(data);
          messagesRef.current = temp;
          setMessages((list) => [...list, data]);
          setIsTyping(false);
        });
        // Listening for Message sync event
        socketRef.current.on(ACTIONS.SYNC_MESSAGE, (data) => {
          setMessages(data.messages);
        });
        // Listening for disconnected
        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          if (soundToggleRef.current) {
            leaveAlertPlayer.current.play();
          }
          toast.info(`${username} left the room.`);
          setClients((prev) => {
            return prev.filter((client) => client.socketId !== socketId);
          });
        });
      };
      init();
      // Disconnect Socket on unmount
      return () => {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
      };
    }
  }, [loading]);

  // Handle Body Change
  const handleBodyChange = (value) => {
    socketRef.current.emit(ACTIONS.BODY_CHANGE, {
      roomId,
      body: value,
    });
    bodyRef.current = value;
    setBody(value);
  };

  // Handle Input Change
  const handleInputChange = (value) => {
    socketRef.current.emit(ACTIONS.INPUT_CHANGE, {
      roomId,
      input: value,
    });
    inputRef.current = value;
    setInput(value);
  };

  // Handle Output Change
  const handleOutputChange = (value) => {
    socketRef.current.emit(ACTIONS.OUTPUT_CHANGE, {
      roomId,
      output: value,
    });
    outputRef.current = value;
    setOutput(value);
  };

  useEffect(() => {
    if (output) {
      handleOutputChange(output);
    }
  }, [output]);

  // Handle Language Change
  const handleLanguageChange = (e) => {
    console.log("e", e.target.value);
    socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, {
      roomId,
      language: e.target.value,
    });
    languageRef.current = e.target.value;
    setLanguage(e.target.value);
  };

  useEffect(() => {
    if (messages.length !== 0 && !minimize && !openChat) {
      if (soundToggleRef.current) {
        messageAlertPlayer.current.play();
      }
      setOpenChat(true);
      setMinimize(true);
      setNewMessage(true);
    }
  }, [messages]);

  // web editor
  // html
  const handleHtmlChange = (value) => {
    socketRef.current.emit(ACTIONS.HTML_CHANGE, {
      roomId,
      html: value,
    });
    htmlRef.current = value;
    setHtml(value);
  };

  // css
  const handleCssChange = (value) => {
    socketRef.current.emit(ACTIONS.CSS_CHANGE, {
      roomId,
      css: value,
    });
    cssRef.current = value;
    setCSS(value);
  };

  // js
  const handleJsChange = (value) => {
    socketRef.current.emit(ACTIONS.JS_CHANGE, {
      roomId,
      js: value,
    });
    jsRef.current = value;
    setJs(value);
  };

  // this useEffect will trigger for every
  // changes in htmlValue, cssValue, jsValue
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCode(`
      <html>
      <body>${htmlValue}</body>
      <style>${cssValue}</style>
      <script>${jsValue}</script>
      </html>`);
    }, 250);
    return () => clearTimeout(timeout);
  }, [htmlValue, cssValue, jsValue]);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="w-full h-screen flex flex-col bg-[#434343] overflow-hidden relative">
          <Helmet>
            <meta charSet="utf-8" />
            <title>Code Buddy | {roomName}</title>
          </Helmet>
          <audio ref={messageAlertPlayer} src={NotificationSound} />
          <audio ref={joinAlertPlayer} src={JoinSound} />
          <audio ref={leaveAlertPlayer} src={LeaveSound} />
          <ToastContainer />
          {openChat && (
            <ChatBox
              setOpenChat={setOpenChat}
              roomName={roomName}
              socketRef={socketRef}
              roomId={roomId}
              username={location.state?.username}
              messages={messages}
              setMessages={setMessages}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              minimize={minimize}
              setMinimize={setMinimize}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              messagesRef={messagesRef}
            />
          )}
          <RoomHeader
            handleLanguageChange={handleLanguageChange}
            inputRef={inputRef}
            outputRef={outputRef}
            bodyRef={bodyRef}
            languageRef={languageRef}
            roomId={roomId}
            socketRef={socketRef}
            output={output}
            setOutput={setOutput}
            setRunning={setRunning}
            running={running}
            setSaving={setSaving}
            saving={saving}
            htmlRef={htmlRef}
            jsRef={jsRef}
            cssRef={cssRef}
            isWeb={isWeb}
          />
          <Sidebar
            setOpenChat={setOpenChat}
            roomName={roomName}
            users={clients}
            isWeb={isWeb}
            setIsWeb={setIsWeb}
          />
          <hr />
          {isWeb ? (
            <div className="w-full h-screen flex flex-col space-y-3">
              <div className="flex-[0.5] flex md:flex-row flex-col w-full h-full grid-cols-3">
                <div className="col-span-1">
                  <CodeEditor
                    displayName="HTML"
                    language="html"
                    value={htmlValue}
                    setValue={setHtml}
                    fontSize={fontSize}
                    theme={theme}
                    handleBodyChange={handleHtmlChange}
                  />
                </div>
                <div className="col-span-1">
                  <CodeEditor
                    displayName="CSS"
                    language="css"
                    value={cssValue}
                    setValue={setCSS}
                    fontSize={fontSize}
                    theme={theme}
                    handleBodyChange={handleCssChange}
                  />
                </div>
                <div className="col-span-1">
                  <CodeEditor
                    displayName="Javascript"
                    language="javascript"
                    value={jsValue}
                    setValue={setJs}
                    fontSize={fontSize}
                    theme={theme}
                    handleBodyChange={handleJsChange}
                  />
                </div>
              </div>
              <div className="flex-[0.5] w-full h-full">
                <iframe
                  srcDoc={Code}
                  title="output"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  sandbox="allow-scripts"
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          ) : (
            <div className="flex lg:flex-row flex-col overflow-y-auto lg:overflow-y-hidden bg-[#434343]">
              <div className="flex-[0.7] border-l-[2rem] md:border-[1rem] border-b-[2rem] md:border-l-[3rem] border-[#434343] lg:h-[80vh]">
                <p className="text-white bg-[#434343] mx-auto">Code</p>
                <Editor
                  type={"body"}
                  theme={theme}
                  width={"100%"}
                  language={language}
                  body={body}
                  handleBodyChange={handleBodyChange}
                  fontSize={fontSize}
                />
              </div>
              <div className="flex-[0.3] flex flex-col border-l-[1rem] md:border-r-[1rem] md:border-b-[1rem] border-[#434343] h-[82vh]">
                <div className=" border-l-[1rem] md:border-[1rem] border-[#434343] h-full ">
                  <p className="text-white bg-[#434343] mx-auto pl-[2rem] lg:pl-0">
                    Input
                  </p>
                  <Editor
                    type={"input"}
                    theme={theme}
                    language={""}
                    body={input}
                    handleInputChange={handleInputChange}
                    width={"100%"}
                    height={"34vh"}
                    fontSize={fontSize}
                  />
                </div>
                <div className="border-l-[1rem] md:border-[1rem] md:border-t-0 border-[#434343] h-full">
                  <p className="text-white bg-[#434343] mx-auto pl-[2rem] lg:pl-0">
                    Output
                  </p>
                  <Editor
                    type={"output"}
                    theme={theme}
                    language={""}
                    body={output}
                    handleOutputChange={handleOutputChange}
                    width={"100%"}
                    readOnly={true}
                    height={"34vh"}
                    fontSize={fontSize}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Room;
