import { imgGroup7, imgVector, imgVector94, imgSun, imgVector1, imgVector2, imgVector3, imgVector4, imgVector5, imgVector6, imgVector7, imgVector8, imgVector9, imgGroup, imgGroup101, imgGroup8 } from "./svg-j9919";

interface ShareYourPreferencesProps {
  onBack?: () => void;
  onNavigateToWaiting?: () => void;
}

export default function ShareYourPreferences({ onBack, onNavigateToWaiting }: ShareYourPreferencesProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f8ff] from-[43.912%] to-[#dde5ff] flex items-center justify-center">
      <div className="w-full max-w-[1440px] mx-auto px-[177.5px] py-[140.833px]">
        
        {/* Header Section */}
        <div className="flex items-end justify-between gap-[64.167px] mb-[81.667px]">
          {/* Cloud Icon */}
          <div className="relative w-[50.247px] h-[50.247px] bg-[#aa76e1] rounded-[14.516px] flex items-center justify-center">
            <div className="w-[19.26px] h-[16.615px]">
              <img className="block max-w-none size-full" src={imgGroup7} />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="font-['Outfit'] font-bold text-[#232323] text-[39.324px] tracking-[-0.8651px] leading-[normal]">
            Share your preferences.
          </h1>
          
          {/* Description */}
          <p className="font-['Outfit'] font-medium text-[#858ca7] text-[16.667px] tracking-[-0.3667px] leading-[20px] text-right w-[490.833px]">
            Tell us what matters most for your trip – from budget to activities – so AI can match the perfect destination for your group.
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-[28.333px] items-start justify-center">
          
          {/* Left Column - Travel Dates */}
          <div className="w-[986.667px]">
            {/* General Section Label */}
            <div className="font-['Outfit'] font-medium text-[#d7dae7] text-[16.667px] tracking-[-0.3667px] leading-[20px] mb-[23.333px]">
              General
            </div>
            
            {/* Travel Dates Card */}
            <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[18.983px] h-[145.655px] mb-[28.333px] shadow-[0px_0px_13.167px_0px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-0 shadow-[0px_0px_5.424px_0px_inset_rgba(255,255,255,0.8)] rounded-[18.983px]" />
              
              {/* Content */}
              <div className="relative p-[37.5px_37.5px_0_37.5px]">
                <div className="flex justify-between items-start mb-[17.5px]">
                  <div>
                    <h3 className="font-['Outfit'] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] leading-[20px] mb-[7.5px]">
                      Travel Dates
                    </h3>
                    <p className="font-['Outfit'] font-medium text-[#b8b6c4] text-[14.167px] tracking-[-0.3117px] leading-[15.833px]">
                      Move the slider to your preferred<br />travel period.
                    </p>
                  </div>
                  <div className="w-[23.333px] h-[23.333px]">
                    <img className="block max-w-none size-full" src={imgVector} />
                  </div>
                </div>
                
                {/* Slider */}
                <div className="relative">
                  <div className="bg-[#ebe2fa] h-[37.551px] rounded-[12.113px] w-[570.533px] ml-[296.667px]" />
                  <div className="absolute top-[5px] left-[485.615px] bg-[#b282e5] h-[27.5px] rounded-[6.057px] w-[144.167px]" />
                  
                  {/* Month Labels */}
                  <div className="absolute top-[55.73px] flex justify-between w-[570.533px] ml-[296.667px]">
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">SEP</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">OCT</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">NOV</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">DEZ</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[#232323] tracking-[-0.533px] text-center">JAN</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[#232323] tracking-[-0.533px] text-center">FEB</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[#232323] tracking-[-0.533px] text-center">MAR</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">APR</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">JUN</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">JUL</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">AUG</span>
                    <span className="font-['Space_Grotesk'] font-bold text-[9.691px] text-[silver] tracking-[-0.533px] text-center">SEP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Budget & Destination */}
          <div className="w-[479.167px] space-y-[28.333px]">
            
            {/* Overall Budget Card */}
            <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[19.224px] h-[147.5px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
              
              <div className="relative p-[37.5px]">
                <div className="flex justify-between items-start mb-[23.333px]">
                  <h3 className="font-['Outfit'] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] leading-[20px]">
                    Overall Budget
                  </h3>
                  <div className="w-[23.333px] h-[23.333px]">
                    <img className="block max-w-none size-full" src={imgVector} />
                  </div>
                </div>
                
                {/* Budget Slider */}
                <div className="relative mb-[18.333px]">
                  <div className="bg-[rgba(178,130,229,0.2)] h-[37.5px] rounded-[12.056px] w-[325px]" />
                  <div className="absolute top-[5px] left-[5px] bg-[#b282e5] h-[27.5px] rounded-[7.234px] w-[185px]" />
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex h-[1.667px] items-center justify-center w-[55px]">
                    <img className="block max-w-none size-full" src={imgVector94} />
                  </div>
                  <span className="font-['Outfit'] font-bold text-[#232323] text-[21.667px] tracking-[-0.4767px] leading-[20px]">
                    400,-
                  </span>
                </div>
              </div>
            </div>

            {/* Destination Type Card */}
            <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[19.224px] h-[223.333px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
              
              <div className="relative p-[37.5px]">
                <div className="flex justify-between items-start mb-[24.167px]">
                  <div>
                    <h3 className="font-['Outfit'] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] leading-[20px] mb-[4.167px]">
                      Destination type
                    </h3>
                    <p className="font-['Outfit'] font-medium text-[#b8b6c4] text-[14.167px] tracking-[-0.3117px] leading-[20px]">
                      Select at least two options.
                    </p>
                  </div>
                  <div className="w-[23.333px] h-[23.333px]">
                    <img className="block max-w-none size-full" src={imgVector} />
                  </div>
                </div>
                
                {/* Options Grid */}
                <div className="grid grid-cols-3 gap-x-[10px] gap-y-[10.833px]">
                  {/* Into the sun */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[14.345px] h-[14.345px] mr-[10.758px]">
                      <img className="block max-w-none size-full" src={imgSun} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Into the sun
                    </span>
                  </div>
                  
                  {/* Mountains - Selected */}
                  <div className="relative bg-[#534e5b] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[13.338px] h-[13.333px] mr-[15.989px]">
                      <img className="block max-w-none size-full" src={imgVector1} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                      Mountains
                    </span>
                  </div>
                  
                  {/* Close to sea */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[12.52px] h-[12.5px] mr-[12.98px]">
                      <img className="block max-w-none size-full" src={imgVector3} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Close to sea
                    </span>
                  </div>
                  
                  {/* City life - Selected */}
                  <div className="relative bg-[#534e5b] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[13.333px] h-[13.333px] mr-[18.821px]">
                      <img className="block max-w-none size-full" src={imgVector2} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                      City life
                    </span>
                  </div>
                  
                  {/* Peaceful */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[13.333px] h-[13.333px] mr-[19.321px]">
                      <img className="block max-w-none size-full" src={imgVector4} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Peaceful
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activities & Duration */}
          <div className="w-[479.167px] space-y-[28.333px]">
            
            {/* Activities & Interests Card */}
            <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[19.224px] h-[223.333px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
              
              <div className="relative p-[37.5px]">
                <div className="flex justify-between items-start mb-[24.167px]">
                  <div>
                    <h3 className="font-['Outfit'] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] leading-[20px] mb-[4.167px]">
                      Activities & Interests
                    </h3>
                    <p className="font-['Outfit'] font-medium text-[#b8b6c4] text-[14.167px] tracking-[-0.3117px] leading-[20px]">
                      Select at least two options.
                    </p>
                  </div>
                  <div className="w-[23.333px] h-[23.333px]">
                    <img className="block max-w-none size-full" src={imgVector} />
                  </div>
                </div>
                
                {/* Options Grid */}
                <div className="grid grid-cols-3 gap-x-[10px] gap-y-[10.833px]">
                  {/* Surfing */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[14.167px] h-[14.001px] mr-[18.257px]">
                      <img className="block max-w-none size-full" src={imgVector6} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Surfing
                    </span>
                  </div>
                  
                  {/* Biking - Selected */}
                  <div className="relative bg-[#534e5b] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[14.356px] h-[13.137px] mr-[22.236px]">
                      <img className="block max-w-none size-full" src={imgVector7} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                      Biking
                    </span>
                  </div>
                  
                  {/* Partying */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[11.74px] h-[14.083px] mr-[17.354px]">
                      <img className="block max-w-none size-full" src={imgVector8} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Partying
                    </span>
                  </div>
                  
                  {/* Chilling - Selected */}
                  <div className="relative bg-[#534e5b] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[13.333px] h-[13.333px] mr-[22.091px]">
                      <img className="block max-w-none size-full" src={imgVector9} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                      Chilling
                    </span>
                  </div>
                  
                  {/* Sightseeing */}
                  <div className="relative bg-[#edeef1] h-[33.172px] rounded-[8.966px] w-[130px] flex items-center justify-center">
                    <div className="w-[13.333px] h-[13.333px] mr-[18.925px]">
                      <img className="block max-w-none size-full" src={imgVector5} />
                    </div>
                    <span className="font-['Space_Grotesk'] font-bold text-[#4b5059] text-[13.448px] tracking-[-0.7397px]">
                      Sightseeing
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Duration Card */}
            <div className="relative bg-[rgba(255,255,255,0.5)] rounded-[19.224px] h-[147.5px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.07)]">
              <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.224px]" />
              
              <div className="relative p-[37.5px]">
                <div className="flex justify-between items-start mb-[40.833px]">
                  <h3 className="font-['Outfit'] font-semibold text-[#232323] text-[18.333px] tracking-[-0.4033px] leading-[20px]">
                    Travel Duration
                  </h3>
                  <div className="w-[23.333px] h-[23.333px]">
                    <img className="block max-w-none size-full" src={imgVector} />
                  </div>
                </div>
                
                {/* Duration Options */}
                <div className="flex gap-[10px]">
                  {/* 1-2 Days */}
                  <div className="relative bg-[#ece3fa] h-[33.333px] rounded-[8.966px] w-[94.167px] flex items-center justify-center">
                    <span className="font-['Space_Grotesk'] font-bold text-[#976cc4] text-[13.448px] tracking-[-0.7397px]">
                      1-2 Days
                    </span>
                  </div>
                  
                  {/* 3-5 Days - Selected */}
                  <div className="relative bg-[#b282e5] h-[33.333px] rounded-[8.966px] w-[94.167px] flex items-center justify-center">
                    <span className="font-['Space_Grotesk'] font-bold text-white text-[13.448px] tracking-[-0.7397px]">
                      3-5 Days
                    </span>
                  </div>
                  
                  {/* 6-8 Days */}
                  <div className="relative bg-[#ece3fa] h-[33.333px] rounded-[8.966px] w-[94.167px] flex items-center justify-center">
                    <span className="font-['Space_Grotesk'] font-bold text-[#976cc4] text-[13.448px] tracking-[-0.7397px]">
                      6-8 Days
                    </span>
                  </div>
                  
                  {/* 9+ Days */}
                  <div className="relative bg-[#ece3fa] h-[33.333px] rounded-[8.966px] w-[94.167px] flex items-center justify-center">
                    <span className="font-['Space_Grotesk'] font-bold text-[#976cc4] text-[13.448px] tracking-[-0.7397px]">
                      9+ Days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Section */}
        <div className="mt-[47.5px] mb-[40px]">
          <div className="font-['Outfit'] font-medium text-[#d7dae7] text-[16.667px] tracking-[-0.3667px] leading-[20px] mb-[23.333px]">
            Custom
          </div>
          
          {/* Custom Input Card */}
          <div className="relative bg-[rgba(255,255,255,0.9)] rounded-[19.167px] h-[59.167px] shadow-[0px_0px_13.333px_0px_rgba(0,0,0,0.04)] w-[986.667px]">
            <div className="absolute inset-0 shadow-[0px_0px_5.492px_0px_inset_rgba(255,255,255,0.8)] rounded-[19.167px]" />
            
            <div className="relative flex items-center h-full px-[70.834px]">
              {/* Plus Icon */}
              <div className="w-[18.333px] h-[18.333px] mr-[23.5px]">
                <img className="block max-w-none size-full" src={imgGroup} />
              </div>
              
              {/* Input Text */}
              <span className="font-['Space_Grotesk'] font-medium text-[#c3c3c3] text-[15px] tracking-[-0.33px] leading-[20px] flex-1">
                Write down, what comes to your mind..
              </span>
              
              {/* Microphone Button */}
              <div className="bg-[#f2f2f2] rounded-[8.333px] w-[40.833px] h-[40.833px] flex items-center justify-center ml-[23.5px]">
                <div className="w-[18.333px] h-[18.333px]">
                  <img className="block max-w-none size-full" src={imgGroup101} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Finish Button */}
        <div className="flex justify-end">
          <button 
            onClick={onNavigateToWaiting}
            className="bg-[#b282e5] rounded-[26.25px] w-[140px] h-[56.121px] flex items-center justify-center gap-[13.696px] cursor-pointer hover:bg-[#9f70d9] transition-colors"
          >
            <div className="w-[18.523px] h-[15.979px]">
              <img className="block max-w-none size-full" src={imgGroup8} />
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-[#f6f8ff] text-[15.978px] tracking-[-0.8788px]">
              Finish
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}