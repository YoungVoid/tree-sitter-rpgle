**FREE

ctl-opt;
ctl-opt options(*nodebugio : *srcstmt);
ctl-opt main(main);

dcl-f someFile extname('MYFILE') prefix(pref : 2);

dcl-c true *On;
dcl-c false *Off;
dcl-c PI 3.14;

// copied from ibm docs
//DCL-ENUM myEnum QUALIFIED;
//   c1 100;
//   c2 200;
//END-ENUM;

//DCL-ENUM employee_types CHAR(3) QUALIFIED;
//   ceo 'CEO';
//   manager 'MGR';
//   regular 'REG' DFT;
//END-ENUM;

dcl-ds Fld ExtName('CUSTMAST') Qualified;
end-ds;

dcl-s companyType varchar(10) dim(*auto : 30);

dcl-ds csz_a Qualified likeds(csz) dim(*auto : 50000) ;

dcl-ds csz_b dim(*auto : 50000) end-ds;

dcl-ds csz_c dim(*auto : 50000); 
end-ds;


dcl-ds dfIndDS len(99);
//--- 21-99 are automatically cleared after EXFMT --------------
    Protect_SD_ALL ind pos(10);
    dfIndClr char(79) pos(21);
    RI_SD_ACTIVE ind pos(40);
    PC_SD_CORPPH ind pos(57);
    DSP_SD_STAMP ind pos(61);
end-ds;

dcl-proc main export;
dcl-pi *N like(i);
end-pi;

	dcl-s i packed(2);
	dcl-s counter packed(5);

	companyType(1) = 'FINANCIAL';

	counter = *Zeros;
	for i = 1 to 10 by 2;
		if companyType(i) = 'ABC';
			counter += 1;
		elseif companyType(i) = 'XYZ';
			counter = counter + 1;
		elseif companyType(i) = *BLANKS;
			counter = counter + 1;
		else;
			// do nothing
		endif;
	endfor;

	return i;

end-proc main;
