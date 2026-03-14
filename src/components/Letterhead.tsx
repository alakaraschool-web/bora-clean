import React from 'react';

interface SchoolSettings {
  name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  letterheadTemplate: string;
}

export const Letterhead: React.FC<{ settings: SchoolSettings; studentPhoto?: string }> = ({ settings, studentPhoto }) => {
  const renderLogo = (size: string = "w-20 h-20") => {
    if (settings.logo) {
      return <img src={settings.logo} alt="School Logo" className={`${size} object-contain mx-auto`} />;
    }
    return (
      <div className={`${size} mx-auto border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-[8px] text-gray-400 font-bold text-center p-2 uppercase`}>
        Affix School Logo
      </div>
    );
  };

  const renderStudentPhoto = (size: string = "w-20 h-20") => {
    if (!studentPhoto) return null;
    return (
      <div className="absolute right-0 top-0">
        <img src={studentPhoto} alt="Student" className={`${size} object-cover rounded-lg border-2 border-gray-100 shadow-sm`} />
      </div>
    );
  };

  const coatOfArms = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Coat_of_arms_of_Kenya_%28Official%29.svg/512px-Coat_of_arms_of_Kenya_%28Official%29.svg.png";

  if (settings.letterheadTemplate === 'modern') {
    return (
      <div className="relative w-full border-b-4 border-kenya-green pb-6 mb-8 text-center">
        <div className="absolute left-0 top-0">
          {renderLogo("w-24 h-24")}
        </div>
        {renderStudentPhoto("w-24 h-24")}
        <div className="flex flex-col items-center">
          <img src={coatOfArms} alt="Coat of Arms" className="w-12 h-12 object-contain mb-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Republic of Kenya</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Ministry of Education</p>
          <h2 className="text-3xl font-black text-kenya-black uppercase tracking-tight leading-none mt-2 mb-1">{settings.name || 'SCHOOL NAME'}</h2>
          <p className="text-sm font-bold text-kenya-green mb-4 italic">"{settings.motto || 'School Motto'}"</p>
          <div className="flex justify-center gap-x-8 gap-y-1 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <p>Address: {settings.address || 'P.O. BOX 12345'}</p>
            <p>Email: {settings.email || 'info@school.ac.ke'}</p>
            <p>Phone: {settings.phone || '+254 700 000 000'}</p>
            <p>Website: {settings.website || 'www.school.ac.ke'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (settings.letterheadTemplate === 'minimal') {
    return (
      <div className="w-full mb-8">
        <div className="relative flex flex-col items-center border-b-2 border-kenya-black pb-4 mb-4 text-center">
          <div className="absolute left-0 top-0">
            {renderLogo("w-16 h-16")}
          </div>
          {renderStudentPhoto("w-16 h-16")}
          <img src={coatOfArms} alt="Coat of Arms" className="w-10 h-10 object-contain mb-2" />
          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Republic of Kenya • Ministry of Education</p>
          <h2 className="text-2xl font-black text-kenya-black uppercase tracking-tighter">{settings.name || 'SCHOOL NAME'}</h2>
        </div>
        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <span>{settings.address}</span>
          <span>{settings.phone}</span>
          <span>{settings.email}</span>
        </div>
      </div>
    );
  }

  if (settings.letterheadTemplate === 'elegant') {
    return (
      <div className="relative w-full mb-8 border-b-4 border-double border-gray-300 pb-6 text-center">
        <div className="absolute left-0 top-0">
          {renderLogo("w-20 h-20")}
        </div>
        {renderStudentPhoto("w-20 h-20")}
        <div className="flex flex-col items-center mb-4">
          <img src={coatOfArms} alt="Coat of Arms" className="w-16 h-16 object-contain mb-2" />
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.4em]">Republic of Kenya</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.4em]">Ministry of Education</p>
        </div>
        <h2 className="text-4xl font-serif font-black text-kenya-black uppercase tracking-widest mt-4 mb-2">{settings.name || 'SCHOOL NAME'}</h2>
        <p className="text-sm font-serif italic text-gray-600 mb-4">"{settings.motto || 'School Motto'}"</p>
        <div className="flex justify-center items-center gap-4 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
          <span>{settings.address}</span>
          <span className="w-1 h-1 bg-kenya-green rounded-full"></span>
          <span>{settings.phone}</span>
          <span className="w-1 h-1 bg-kenya-green rounded-full"></span>
          <span>{settings.email}</span>
        </div>
      </div>
    );
  }

  if (settings.letterheadTemplate === 'bold') {
    return (
      <div className="relative w-full mb-8 bg-kenya-black text-white p-6 rounded-t-xl text-center">
        <div className="absolute left-6 top-6">
          {renderLogo("w-20 h-20 bg-white rounded-xl p-1")}
        </div>
        {renderStudentPhoto("w-20 h-20")}
        <div className="flex flex-col items-center mb-4">
          <img src={coatOfArms} alt="Coat of Arms" className="w-16 h-16 object-contain bg-white rounded-full p-1 mb-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Republic of Kenya</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Ministry of Education</p>
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white">{settings.name || 'SCHOOL NAME'}</h2>
        <p className="text-base font-bold italic text-kenya-green">"{settings.motto || 'School Motto'}"</p>
        <div className="text-[11px] text-gray-300 font-bold uppercase tracking-widest pt-4 flex justify-center gap-4 border-t border-gray-800 mt-4">
          <span>{settings.address}</span>
          <span>•</span>
          <span>Tel: {settings.phone}</span>
          <span>•</span>
          <span>Email: {settings.email}</span>
        </div>
      </div>
    );
  }

  if (settings.letterheadTemplate === 'compact') {
    return (
      <div className="relative w-full mb-6 border-b-2 border-kenya-green pb-3 flex flex-col items-center text-center">
        <div className="absolute left-0 top-0">
          {renderLogo("w-12 h-12")}
        </div>
        {renderStudentPhoto("w-12 h-12")}
        <img src={coatOfArms} alt="Coat of Arms" className="w-10 h-10 object-contain mb-1" />
        <h2 className="text-xl font-black text-kenya-black uppercase tracking-tight leading-none">{settings.name || 'SCHOOL NAME'}</h2>
        <p className="text-[10px] font-bold text-kenya-green italic mb-2">"{settings.motto || 'School Motto'}"</p>
        <div className="flex justify-center gap-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
          <p>{settings.address}</p>
          <p>{settings.phone}</p>
          <p>{settings.email}</p>
        </div>
      </div>
    );
  }

  // Standard template
  return (
    <div className="relative text-center space-y-3 w-full border-b-2 border-gray-100 pb-8 mb-8">
      <div className="absolute left-0 top-0">
        {renderLogo("w-20 h-20")}
      </div>
      {renderStudentPhoto("w-20 h-20")}
      <div className="flex flex-col items-center mb-4">
        <img src={coatOfArms} alt="Coat of Arms" className="w-16 h-16 object-contain mb-2" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Republic of Kenya</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Ministry of Education</p>
      </div>
      <h2 className="text-3xl font-black text-kenya-black uppercase tracking-tight">{settings.name || 'SCHOOL NAME'}</h2>
      <p className="text-base font-bold italic text-kenya-green">"{settings.motto || 'School Motto'}"</p>
      <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest pt-4 flex justify-center gap-4 border-t border-gray-50 mt-4">
        <span>{settings.address}</span>
        <span>•</span>
        <span>Tel: {settings.phone}</span>
        <span>•</span>
        <span>Email: {settings.email}</span>
      </div>
    </div>
  );
};
