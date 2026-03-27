dcl-pi *n;
  parm_recds packed(15 : 5); // Number of records to create
end-pi;
dcl-s p_recds int(10);

dcl-ds Fld ExtName('CUSTMAST') Qualified;
end-ds;
// === SQL State Constants =====================================
dcl-c SQLSUCCESS      '00000';
dcl-c SQLNODATA       '02000';
dcl-c SQLNOMOREDATA   '02000';
dcl-c SQLNOTJOURNALED '01567';

dcl-s companyType varchar(10) dim(*auto : 30);
dcl-s streetType varchar(10) dim(*auto : 30);
dcl-s varCUSTID varchar(4);
// === City/state/zip record ===
dcl-ds csz qualified;                        
  zip int(10);
  ziptype char(10);
  city char(20);
  st char(2);
end-ds;

// === Arrary of City, State and Zip records ===
dcl-ds csz_a likeds(csz) dim(*auto : 50000) ;

dcl-s cszCount int(10);
dcl-s MaxL int(10);
dcl-s csz_I int(10);
dcl-s j int(10);
// dcl-s t int(10);
DCL-S adrX int(10);
dcl-s nRecds int(10);
dcl-s wk10 char(10);
dcl-s wkStr varchar(50);

// === Generate a word =========================================
dcl-proc genWord;
  dcl-pi genWord varchar(30);
    MinL int(10) const;
    MaxL int(10) const;
  end-pi;
  // Straight alphabetic
  dcl-s Alpha varchar(50)
  inz('ABCDEFGHIIJKLMNOPQRSTUVWXYZZ');
  // Biased towards vowels
  dcl-s vAlpha varchar(50)
  inz('AAAAABCDEEEEEFGHIIIIIJKLMNOOOOOPQRSTUUUVWXYZZ');

  dcl-s wk30 varchar(30) inz;
  dcl-s TgtL int(10);
  dcl-s j int(10);

end-proc;

// === Generate a phone like (800) 231-1876 ====================
dcl-proc genPhone;
  dcl-pi genPhone varchar(20);
  end-pi;
  dcl-s wkret varchar(20);
  dcl-s wk3 char(3);
  dcl-s wk4 char(4);
  return wkret;
end-proc;

dcl-pi *n;
    pID like(custid);
    pMaintain char(1);
end-pi;

dcl-f MTNCUSTD workstn infds(dfInfDS) indds(dfIndDS) usropn;
dcl-ds CUSTMAST_ds extname('CUSTMAST') end-ds;
dcl-c SQLSUCCESS '00000';
dcl-c SQLNODATA '02000';
dcl-c SQLNOMOREDATA '02000';
dcl-c SQLDUPRECD '23505';
dcl-c SQLROWLOCKED '57033';
//=== Display File Information Data Structure ==================
//    Allows us to determine which function key was pressed
dcl-ds dfInfDS;
    Key char(1) pos(369);
end-ds;
//=== Display File Indicator Data Structure ====================
// This is a "private" indicator area for the display file.
//--- 01-20 are not automatically cleared after EXFMT ----------
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
//=== Screen Header Text =======================================
dcl-s H2TextE like(sh_funct) inz('Change Customer');
dcl-s H2TextA like(sh_funct) inz('Add Customer');
dcl-s H2TextD like(sh_funct) inz('Displaying Customer');
//=== External Programs Prototypes =============================
dcl-pr PmtState extpgm('PMTSTATER');
    *n like(state); // TheState
end-pr;
//=== Global Switches ==========================================
dcl-s SflMsgSnt ind;
dcl-c COWSCOMEHOME const('0');
dcl-s Function char(1);
dcl-c DISPLAYING const('D');
dcl-c EDITING const('E');
dcl-c ADDING const('A');
dcl-s NoErrors ind;
// === Global Fields ===========================================
dcl-s Orig_CHGTIME timestamp;
//=== Work Fields ==============================================
dcl-s wkInt int(10);
dcl-s wkMsgText varchar(256);
// === Next available customer number ==========================
// CUSTNEXT        ds                  dtaara(CUSTNEXT)
dcl-s Cust_Next char(4) dtaara('CUSTNEXT');
dcl-s varCust_Next varchar(4);
//=== Program Status Data Structure ============================
dcl-ds ProgStatus PSDS;
    PgmName *PROC;
    CURR_USER char(10) pos(358); // * Current user
end-ds;
dcl-s MainProc char(10);
//=== ReadRecd ===============================================
Dcl-Proc ReadRecd;
End-Proc;
//=== FillScreenFields =======================================
Dcl-Proc FillScreenFields;
End-Proc;
//=== F04Prompt ==============================================
// CF04 reads the screen data. We then prompt and replace
// anything in the state field, then we redisplay and
// re-edit the screen data.
// Always sets NoError to *off to force re-edit
Dcl-Proc F04Prompt;
End-Proc;
//=== EditUpdData ============================================
// Edit the screen fields that can be changed on a update.
// Give up when the first error found.
// A valid screen field is moved to the database record.
Dcl-Proc EditUpdData;
End-Proc;
//=== EditAddData ============================================
// Edit the screen fields needed to add a record.
// Give up when the first error found.
// A valid screen field is moved to the database record.
Dcl-Proc EditAddData;
   // For this program. same data for edit and add.
End-Proc;
//=== Edit_SD_ACTIVE==========================================
Dcl-Proc Edit_SD_ACTIVE;
End-Proc;
//=== Edit_SD_NAME ===========================================
Dcl-Proc Edit_SD_NAME;
End-Proc;
//=== Edit_SD_ADDR ===========================================
Dcl-Proc Edit_SD_ADDR;
End-Proc;
//=== Edit_SD_CITY ===========================================
Dcl-Proc Edit_SD_CITY;
End-Proc;
//=== Edit_SD_STATE ==========================================
Dcl-Proc Edit_SD_STATE;
End-Proc;
//=== BldFKeyText ============================================
// Build the Function key text for the bottom of the screen.
Dcl-Proc BldFkeyText;
//=== Text for function keys ===================================
    dcl-c F3TEXT 'F3=Exit';
    dcl-c F4TEXT 'F4=Prompt+';
    dcl-c F5TEXT 'F5=Refresh';
    dcl-c F12TEXT 'F12=Cancel';
End-Proc;
//=== CloseDownPgm ===========================================
// Things to do before we issue a return to the caller
Dcl-Proc CloseDownPgm;
//  Closing the display file may cause any subfile display in
//  the caller to blank out.
End-Proc;
//=== Init ===================================================
// Every time initialization logic
Dcl-Proc Init;
end-proc;
// end-proc;
//============================================================
//   S u b  P r o c e d u r e s
//============================================================
//=== CatB ===================================================
// Concatenates a string to another string with a blank between.
// If the target string is all blank to start with it will not
// end up with a leading blank.
dcl-proc catB;
    dcl-pi catB varchar(79);
        ToStr varchar(79) value;
        AddStr varchar(79) value;
    end-pi;
end-proc;
//=== SQLProblem ===============================================
// For those "Never should happen" SQL errors.
// Issues DUMP(A) to dump memory, then ends program by
// sending an *ESCAPE message of the supplied debugging text.
dcl-proc SQLProblem;
    dcl-pi SQLProblem;
        piSQLDebug varchar(1024) value;
    end-pi;
//--- Local Variables ------------------------------------------
    dcl-s wkSQLDebug varchar(1024);
end-proc;
//--------------------------------------------------------------
// Procedure name: SndSflMsg
// Purpose:        Send a message to the Error Subfile
// Returns:        *ON
// Parameter:      ErrMsgId => Msg Id to Send
// Parameter:      ErrMsgData => Optional Error Message Data
// Parameter:      ErrMsgFile => Optional Error Message File
//                 Defaults to CUSTMSGF
//--------------------------------------------------------------
dcl-proc SndSflMsg;
    dcl-pi SndSflMsg ind;
        ErrMsgId char(7) const;
        ErrMsgData char(80) const options(*nopass:*varsize);
        ErrMsgFile char(10) const options(*nopass);
    end-pi;
// Local fields
    dcl-s retField ind;
    dcl-s wkMsgId char(7);
    dcl-s wkMsgFile char(10);
    dcl-s wkMsgData varchar(512);
end-proc;

dcl-pi *n;
    pParmType char(1);
    pCustID like(CUSTID);     
end-pi;

//=== External Programs Prototypes ============================
//--- Display/maintain customer ---
dcl-pr CustDsp extpgm('MTNCUSTR');
    *n options(*nopass) like(custid); // CustID
    *n char(1) options(*nopass); // Maintain
end-pr;
//--- Prompt for State
dcl-pr PmtState extpgm('PMTSTATER');
    *n like(state); // TheState
end-pr;
