import React, { useEffect } from "react";

const CustomCursor = () => {
  useEffect(() => {
    const cd = document.getElementById("cd");
    const cr = document.getElementById("cr");
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    let animationFrameId;

    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (cd) {
        cd.style.left = mx + "px";
        cd.style.top = my + "px";
      }
    };

    const animateCursor = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      if (cr) {
        cr.style.left = rx + "px";
        cr.style.top = ry + "px";
      }
      animationFrameId = requestAnimationFrame(animateCursor);
    };

    document.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(animateCursor);

    // Global hover effect for interactive elements
    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.hasAttribute("onclick") ||
        target.closest("[onclick]") ||
        target.closest(".nav-cta, .btn-p, .btn-g, .step-card, .tier, .why-card, .stack-item, .prompt-card, .bm-group")
      ) {
        if (cd) cd.style.cssText = "width:13px;height:13px";
        if (cr) cr.style.cssText = "width:50px;height:50px;opacity:0.6";
      }
    };

    const handleMouseOut = () => {
      if (cd) cd.style.cssText = "width:8px;height:8px";
      if (cr) cr.style.cssText = "width:34px;height:34px;opacity:0.38";
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div className="cur" id="cd"></div>
      <div className="cur" id="cr"></div>
    </>
  );
};

export default CustomCursor;
