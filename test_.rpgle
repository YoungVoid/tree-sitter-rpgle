dcl-ds Fld ExtName('CUSTMAST') Qualified;
end-ds;

dcl-s companyType varchar(10) dim(*auto : 30);
dcl-ds csz_a likeds(csz) dim(*auto : 50000) ;


dcl-ds csz_a likeds(csz) dim(*auto : 50000) end-ds;

dcl-ds dfIndDS len(99);
//--- 21-99 are automatically cleared after EXFMT --------------
    Protect_SD_ALL ind pos(10);
    dfIndClr char(79) pos(21);
    RI_SD_ACTIVE ind pos(40);
    PC_SD_ACTIVE ind pos(41);
    RI_SD_NAME ind pos(42);
    PC_SD_NAME ind pos(43);
    RI_SD_ADDR ind pos(44);
    PC_SD_ADDR ind pos(45);
    RI_SD_CITY ind pos(46);
    PC_SD_CITY ind pos(47);
    RI_SD_STATE ind pos(48);
    PC_SD_STATE ind pos(49);
    RI_SD_ZIP ind pos(50);
    PC_SD_ZIP ind pos(51);
    RI_SD_ACCTPH ind pos(52);
    PC_SD_ACCTPH ind pos(53);
    RI_SD_ACCTMGR ind pos(54);
    PC_SD_ACCTMGR ind pos(55);
    RI_SD_CORPPH ind pos(56);
    PC_SD_CORPPH ind pos(57);
    DSP_SD_STAMP ind pos(61);
end-ds;


