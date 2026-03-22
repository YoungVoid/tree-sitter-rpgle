dcl-ds vs qualified;
	s1 char(3) inz('  ');
	*n char(3) inz(SP0);
	*n char(3) inZ(SP1);
	*n char(3) inZ(SP2);
	*n char(3) inZ(SP3);
	validSpaces char(3) dim(5) samepos(s1);
end-ds;

if (%trim(ctlValues(2)) in vs.validSpaces);

// --- Type Definitions (Interfaces approximated with procedures) ---
dcl-ds Rectangle qualified;
    Width  float(8);
    Height float(8);
end-ds;

dcl-ds Circle qualified;
    Radius char(1) float(8);
end-ds;
