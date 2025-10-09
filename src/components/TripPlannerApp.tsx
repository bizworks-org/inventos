import { useState, useEffect } from "react";
import MacBookPro1668 from "../imports/MacBookPro1668-1-354";
import MacBookPro1669 from "../imports/MacBookPro1669";
import MacBookPro1670 from "../imports/MacBookPro1670";
import MacBookPro1672 from "../imports/MacBookPro1672";
import MacBookPro1674 from "../imports/MacBookPro1674";
import MacBookPro1675 from "../imports/MacBookPro1675-132-135";
import SharePreferencesScreen from "./SharePreferencesScreen";
import { SessionProvider } from "./SessionContext";
import Frame126 from "../imports/Frame126";

export default function TripPlannerApp() {
  const [currentScreen, setCurrentScreen] = useState<"landing" | "extended" | "invite" | "preferences" | "waiting" | "results" | "details">("landing");
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle window resize to detect when to show responsive screen
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigateToExtended = () => {
    setCurrentScreen("extended");
  };

  const handleNavigateToInvite = () => {
    setCurrentScreen("invite");
  };

  const handleNavigateToPreferences = () => {
    setCurrentScreen("preferences");
  };

  const handleNavigateToWaiting = () => {
    setCurrentScreen("waiting");
  };

  const handleNavigateToResults = () => {
    setCurrentScreen("results");
  };

  const handleNavigateToDetails = () => {
    setCurrentScreen("details");
  };

  const handleBackToLanding = () => {
    setCurrentScreen("landing");
  };

  const handleBackToExtended = () => {
    setCurrentScreen("extended");
  };

  const handleBackToInvite = () => {
    setCurrentScreen("invite");
  };

  const handleBackToPreferences = () => {
    setCurrentScreen("preferences");
  };

  const handleBackToWaiting = () => {
    setCurrentScreen("waiting");
  };

  const handleBackToResults = () => {
    setCurrentScreen("results");
  };

  const openFullApplication = () => {
    // Open the Figma site in a new window
    const newWindow = window.open(
      'https://star-pry-98962388.figma.site',
      '_blank',
      'width=' + screen.availWidth + ',height=' + screen.availHeight + ',left=0,top=0,resizable=yes,scrollbars=yes'
    );
    
    if (newWindow) {
      // Focus the new window
      newWindow.focus();
    }
  };

  // Calculate responsive scale for full application based on window width
  const calculateFullAppScale = () => {
    const referenceWidth = 1200; // Reference width for optimal display (no scaling)
    const scalingStartWidth = 800; // Width where scaling begins
    const minScale = 0.7; // Minimum scale factor
    
    // If width is above reference, no scaling needed
    if (windowWidth >= referenceWidth) {
      return 1;
    }
    
    // If width is above scaling start point, no scaling needed
    if (windowWidth >= scalingStartWidth) {
      return 1;
    }
    
    // Calculate scale factor between scaling start point and minimum
    const scaleRange = 1 - minScale; // 0.3
    const widthRange = scalingStartWidth; // Distance from 0 to scalingStartWidth
    const widthProgress = Math.max(0, windowWidth) / widthRange;
    
    return Math.max(minScale, minScale + (scaleRange * widthProgress));
  };

  const fullAppScale = calculateFullAppScale();

  // Show responsive screen if window width is less than 950px
  if (windowWidth < 950) {
    return (
      <SessionProvider>
        <Frame126 onOpenFullApp={openFullApplication} />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <div 
        className={`${currentScreen === "results" ? "min-h-screen bg-gradient-to-b from-[#e8d5ff] to-[#f5f0ff]" : ""} ${fullAppScale < 1 ? "overflow-x-auto" : ""}`}
        style={{
          transform: fullAppScale < 1 ? `scale(${fullAppScale})` : undefined,
          transformOrigin: fullAppScale < 1 ? 'top center' : undefined,
          width: fullAppScale < 1 ? `${100 / fullAppScale}%` : undefined,
        }}
      >
        {currentScreen === "landing" ? (
          <MacBookPro1668 onNavigate={handleNavigateToExtended} />
        ) : currentScreen === "extended" ? (
          <MacBookPro1669 onNavigateToInvite={handleNavigateToInvite} />
        ) : currentScreen === "invite" ? (
          <MacBookPro1670 onBack={handleBackToExtended} onNavigateToPreferences={handleNavigateToPreferences} />
        ) : currentScreen === "preferences" ? (
          <SharePreferencesScreen onFinish={handleNavigateToWaiting} />
        ) : currentScreen === "waiting" ? (
          <MacBookPro1672 onBack={handleBackToPreferences} onStartSearch={handleNavigateToResults} />
        ) : currentScreen === "results" ? (
          <MacBookPro1674 onUnveil={handleNavigateToDetails} />
        ) : (
          <MacBookPro1675 onBack={handleBackToResults} onBackToLanding={handleBackToLanding} />
        )}
      </div>
    </SessionProvider>
  );
}
