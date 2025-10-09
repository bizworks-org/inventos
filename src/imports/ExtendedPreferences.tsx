import Group145 from "./Group145";

interface ExtendedPreferencesProps {
  onBack?: () => void;
  onNavigateToWaiting?: () => void;
}

export default function ExtendedPreferences({ onBack, onNavigateToWaiting }: ExtendedPreferencesProps) {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-b from-[#e8d5ff] to-[#f5f0ff]">
      {/* Main centered content */}
      <div className="flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-['Outfit',_sans-serif] font-bold text-[#232323] text-[39.324px] tracking-[-0.8651px] mb-4">
            Share your preferences.
          </h1>
          <p className="font-['Outfit',_sans-serif] font-medium text-[#858ca7] text-[16.667px] tracking-[-0.3667px] max-w-[490px]">
            Tell us what matters most for your trip – from budget to activities – so AI can match the perfect destination for your group.
          </p>
        </div>

        {/* Travel Duration Section */}
        <div className="mb-12 bg-[rgba(255,255,255,0.5)] rounded-[19.224px] p-8 relative z-10 shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]">
          <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
          <div className="relative z-20">
            <h2 className="font-['Outfit',_sans-serif] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] mb-2">
              Travel Duration
            </h2>
            <p className="font-['Outfit',_sans-serif] font-medium text-[#b8b6c4] text-[14.167px] tracking-[-0.3117px] mb-8">
              How many days are you planning?
            </p>
            
            {/* Duration Options */}
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="relative z-30">
                <div className="bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[100px] relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="font-['Space_Grotesk',_sans-serif] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                    1-2 days
                  </span>
                </div>
              </div>
              
              <div className="relative z-30">
                <div className="bg-[#534e5b] h-[33.172px] rounded-[8.966px] w-[100px] relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="font-['Space_Grotesk',_sans-serif] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                    3-5 days
                  </span>
                </div>
              </div>
              
              <div className="relative z-30">
                <div className="bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[100px] relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="font-['Space_Grotesk',_sans-serif] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                    6-10 days
                  </span>
                </div>
              </div>
              
              <div className="relative z-30">
                <div className="bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[100px] relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="font-['Space_Grotesk',_sans-serif] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                    2+ weeks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Input Section */}
        <div className="mb-12 bg-[rgba(255,255,255,0.5)] rounded-[19.224px] p-8 relative z-10 shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)] w-full max-w-4xl">
          <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
          <div className="relative z-20">
            <h2 className="font-['Outfit',_sans-serif] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] mb-2">
              Custom
            </h2>
            <p className="font-['Outfit',_sans-serif] font-medium text-[#b8b6c4] text-[14.167px] tracking-[-0.3117px] mb-8">
              Tell us anything else that matters to you.
            </p>
            
            {/* Custom Input Field */}
            <div className="relative z-30 w-full h-[59.167px]">
              <Group145 />
            </div>
          </div>
        </div>

        {/* Finish Button */}
        <div className="cursor-pointer relative z-20" onClick={onNavigateToWaiting}>
          <div className="bg-[#7a71ca] rounded-[18.167px] w-[192.5px] h-[192.5px] relative flex items-center justify-center">
            <span className="font-['Outfit',_sans-serif] font-semibold text-white text-[18.333px] tracking-[-0.4033px]">
              Finish
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}