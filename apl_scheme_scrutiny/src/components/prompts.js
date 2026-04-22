import { useEffect } from "react";
import { unstable_useBlocker as useBlocker } from "react-router-dom";

const usePrompt = (message, when = true) => {
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state === "blocked") {
      const proceed = window.confirm(message);
      if (proceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);
};

export default usePrompt;