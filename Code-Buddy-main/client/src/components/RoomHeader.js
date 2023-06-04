import React, { useEffect, useState } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { allLangauges } from "../utils/langauges";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  fontSizeState,
  langaugeState,
  themeState,
} from "../atoms/editorOptionsModal";
import axios from "axios";
import { toast } from "react-toastify";
import { ACTIONS } from "../utils/Actions";
import { SoundSwitch, ThemeSwitch } from "../utils/Switches";
import { ThemeContext } from "../utils/ThemeFunction";
import { sound } from "../atoms/soundModal";
const langauges = Object.entries(allLangauges);
const themes = [
  "monokai",
  "github",
  "solarized_dark",
  "dracula",
  "github",
  "solarized_dark",
  "monokai",
  "eclipse",
  "tomorrow_night",
  "tomorrow_night_blue",
  "xcode",
  "ambiance",
  "solarized_light",
].sort();

const fontSizes = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
];

const style = {
  color: "white",
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#ffffff",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(228, 219, 233, 0.25)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(228, 219, 233, 0.75)",
  },
  ".MuiSvgIcon-root ": {
    fill: "white !important",
  },
};

const RoomHeader = ({
  handleLanguageChange,
  roomId,
  bodyRef,
  languageRef,
  inputRef,
  socketRef,
  outputRef,
  setOutput,
  setRunning,
  running,
  setSaving,
  saving,
  htmlRef,
  cssRef,
  jsRef,
  isWeb,
}) => {
  const { themeMode, setThemeMode } = React.useContext(ThemeContext);
  const [soundToggle, setSoundToggle] = useRecoilState(sound);
  // Modal states
  const language = useRecoilValue(langaugeState);
  const [theme, setTheme] = useRecoilState(themeState);
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  // Saving and Running State

  const [submissionID, setSubmissionID] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionCheckerID, setSubmissionCheckerId] = useState(null);

  // common response from paizo.io
  const compeletedStatus = "completed";

  // Save Code Handler
  const saveCode = async () => {
    setSaving(true);
    socketRef.current.emit(ACTIONS.SAVE, {
      roomId,
      socketId: socketRef.current.id,
    });

    if (isWeb === false) {
      await axios
        .post(`${process.env.REACT_APP_SERVER_URL}/api/save`, {
          language: languageRef.current,
          roomId: roomId,
          body: bodyRef.current,
          input: inputRef.current,
        })
        .then((res) => {
          setSaving(false);
          socketRef.current.emit(ACTIONS.SAVED, {
            roomId,
          });
          toast.success("Code saved successfully");
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error in saving");
        });
    } else {
      await axios
        .post(`${process.env.REACT_APP_SERVER_URL}/api/saveweb`, {
          html: htmlRef.current,
          roomId: roomId,
          css: cssRef.current,
          js: jsRef.current,
        })
        .then((res) => {
          setSaving(false);
          socketRef.current.emit(ACTIONS.SAVED, {
            roomId,
          });
          toast.success("Code saved successfully");
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error in saving");
        });
    }
  };

  useEffect(() => {
    if (submissionStatus == compeletedStatus && submissionCheckerID) {
      // destroy the checker
      clearInterval(submissionCheckerID);
      setSubmissionCheckerId(null);

      const params = new URLSearchParams({
        id: submissionID,
        api_key: "guest",
      });

      const outputQuery = params.toString();
      axios
        .get(`https://api.paiza.io/runners/get_details?${outputQuery}`)
        .then((res) => {
          console.log("output", res.data);
          const { stdout, stderr, build_stderr } = res.data;
          let newOutput = "";
          if (stdout) newOutput += stdout;
          if (stderr) newOutput += stderr;
          if (build_stderr) newOutput += build_stderr;
          setRunning(false);
          socketRef.current.emit(ACTIONS.RUNNED, {
            roomId,
          });
          if (newOutput) {
            setOutput(newOutput);
            outputRef.current = newOutput;
          }
        })
        .catch((err) => {
          setRunning(false);
          toast.error("Error in running");
          socketRef.current.emit(ACTIONS.RUNNED, {
            roomId,
          });
        });
    }
  }, [submissionStatus]);

  const runCode = async () => {
    setRunning(true);
    socketRef.current.emit(ACTIONS.RUN, {
      roomId,
      socketId: socketRef.current.id,
    });
    const params = {
      source_code: bodyRef.current,
      language: language,
      input: inputRef.current,
      api_key: "guest",
    };

    await axios
      .post(`https://api.paiza.io/runners/create`, params)
      .then((res) => {
        const { id, status } = res.data;
        setSubmissionID(id);
        setSubmissionStatus(status);
      })
      .catch((err) => {
        console.log(err);
        setSubmissionID("");
        toast.error("Could not run code");
      });
  };

  useEffect(() => {
    if (submissionID) {
      setSubmissionCheckerId(setInterval(() => checkSubmissionStatus(), 1000));
    }
  }, [submissionID]);

  const checkSubmissionStatus = async () => {
    const params = new URLSearchParams({
      id: submissionID,
      api_key: "guest",
    });

    const statusQuery = params.toString();
    await axios
      .get(`https://api.paiza.io/runners/get_status?${statusQuery}`)
      .then((res) => {
        console.log("status", res.data);
        const { status } = res.data;
        setSubmissionStatus(status);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="flex md:flex-row flex-col text-[#5b5b5b] lg:space-x-8 md:space-x-4 space-y-3 md:space-y-0 px-8 lg:pl-10 py-4 w-full font-semibold text-[1.2rem] bg-white  dark:bg-[#2c2e3f]">
      {!isWeb && (
        <div className="md:w-[10rem] w-full">
          <FormControl fullWidth>
            <InputLabel
              sx={{ color: themeMode === "dark" ? "white" : "" }}
              id="demo-simple-select-label"
            >
              Choose Language
            </InputLabel>
            {themeMode === "dark" ? (
              <Select
                sx={style}
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={language}
                label="Choose Language"
                onChange={handleLanguageChange}
              >
                {langauges.map((lang, i) => (
                  <MenuItem key={i} value={lang[1]}>
                    {lang[0]}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={language}
                label="Choose Language"
                onChange={handleLanguageChange}
              >
                {langauges.map((lang, i) => (
                  <MenuItem key={i} value={lang[1]}>
                    {lang[0]}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
        </div>
      )}
      <div className="md:w-[10rem] w-full">
        <FormControl fullWidth>
          <InputLabel
            sx={{ color: themeMode === "dark" ? "white" : "" }}
            id="demo-simple-select-label"
          >
            Choose Theme
          </InputLabel>
          {themeMode === "dark" ? (
            <Select
              sx={style}
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={theme}
              label="Choose Theme"
              onChange={(e) => setTheme(e.target.value)}
            >
              {themes.map((theme, i) => (
                <MenuItem key={i} value={theme}>
                  {theme}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={theme}
              label="Choose Theme"
              onChange={(e) => setTheme(e.target.value)}
            >
              {themes.map((theme, i) => (
                <MenuItem key={i} value={theme}>
                  {theme}
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
      </div>
      <div className="md:w-[10rem] w-full">
        <FormControl fullWidth>
          <InputLabel
            sx={{ color: themeMode === "dark" ? "white" : "" }}
            id="demo-simple-select-label"
          >
            Choose Font Size
          </InputLabel>
          {themeMode === "dark" ? (
            <Select
              sx={style}
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={fontSize}
              label="Choose Font Size"
              onChange={(e) => setFontSize(e.target.value)}
            >
              {fontSizes.map((size, i) => (
                <MenuItem key={i} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={fontSize}
              label="Choose Font Size"
              onChange={(e) => setFontSize(e.target.value)}
            >
              {fontSizes.map((size, i) => (
                <MenuItem key={i} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
      </div>
      <div className="md:w-[10rem] w-full flex items-center space-x-1 border-[1px] border-gray-300 hover:border-gray-600 dark:border-white justify-center rounded-md">
        <ThemeSwitch setThemeMode={setThemeMode} themeMode={themeMode} />
      </div>
      <div className="md:w-[10rem] w-full flex items-center space-x-1 border-[1px] border-gray-300 hover:border-gray-600 dark:border-white justify-center rounded-md">
        <SoundSwitch
          setThemeMode={setThemeMode}
          themeMode={themeMode}
          setSoundToggle={setSoundToggle}
        />
      </div>

      <div className="flex space-x-5  md:justify-end">
        <div className="md:w-[10rem] w-full">
          <button
            onClick={() => saveCode()}
            disabled={saving || running}
            className="rounded-md w-full dark:text-black text-white bg-gray-700 dark:bg-white py-3 hover:bg-black hover:dark:bg-gray-200 duration-150 transition-all"
          >
            {saving ? "Saving" : "Save"}
          </button>
        </div>
        {!isWeb && (
          <div className="md:w-[10rem] w-full">
            <button
              onClick={() => runCode()}
              disabled={running || saving}
              className="rounded-md w-full dark:text-black text-white bg-gray-700 dark:bg-white py-3 hover:bg-black hover:dark:bg-gray-200 duration-150 transition-all"
            >
              {running ? "Running" : "Run"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomHeader;
