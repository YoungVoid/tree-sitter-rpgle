**FREE

// Booking system:

// wys plekke wat oop is = _
// wys plekke wat toe is = X

// bv:


//   1 2 3 4 5 6 7 8
// A x x x x x x x x
// B x x x _ _ _ x x
// C _ _ _ _ x x x x
// D _ _ _ x x x x x
// E x x x x x _ _ _
// F _ _ x x x x _ _
// G x x x _ _ x x x
// H x x x x x x x x


//   1,2,3,4,5,6,7,8
// A x,x,x,x,x,x,x,x
// B x,x,x,_,_,_,x,x
// C _,_,_,_,x,x,x,x
// D _,_,_,x,x,x,x,x
// E x,x,x,x,x,_,_,_
// F _,_,x,x,x,x,_,_
// G x,x,x,_,_,x,x,x
// H x,x,x,x,x,x,x,x


// booking so moet die volgende wys

// *Pryse
// *Rye
// *Eerste een vul na regs op
// *Confirmation
// *opsies gee waar daar is
// *seker maak input reg

ctl-opt dftactgrp(*no);
ctl-opt option(*srcstmt:*nodebugio);

ctl-opt main(main);

dcl-f PBSSCREEN workstn indds(WkStnInd) usage(*input : *output);

dcl-ds WkStnInd;
  ExitKey        ind        pos(03);
  RefreshKey     ind        pos(05);
  UpdateKey      ind        pos(10);
  PreviousKey    ind        pos(12);
end-ds;



// Currently only cols 1-8 and rows 1-8 as per example
dcl-c rowcount 8;
dcl-c seatcount 8;
dcl-c SeatOpen '_';
dcl-c SeatClosed 'X';
dcl-c SeatSeparator ' ';

dcl-s i int(10);
dcl-s j int(10);

DCL-DS fileData DTAARA(*AUTO : *USRCTL : 'VOID1/PBSFILE') qualified;
    dcl-ds row dim(rowcount);
        seat Char(1) dim(seatcount);
    end-ds;
END-DS;

DCL-DS R1RowFields qualified;
    R1COLHDG      Char(17);
    R1ROW1        Char(17);
    R1ROW2        Char(17);
    R1ROW3        Char(17);
    R1ROW4        Char(17);
    R1ROW5        Char(17);
    R1ROW6        Char(17);
    R1ROW7        Char(17);
    R1ROW8        Char(17);
END-DS;



dcl-proc main;
    dcl-pi *n ;
        p_resetFileData    ind options(*nopass:*Omit);
    end-pi;

    // MAIN LOGIC STARTS HERE
    init();

    if %passed(p_resetFileData);
        resetFileData();
    endif;

    dow not ExitKey and not PreviousKey;

        BuildFileData();

        write PBSF1;
        exfmt PBSMAINR1;

        processScreenInput();

    enddo;

    *INLR = *ON;
    return;

end-proc;

dcl-proc init;
    dcl-pi *n ;
    end-pi;

    R1PROG = 'PBSMAIN';

    return;

end-proc init;

dcl-proc BuildFileData;
    dcl-pi *n ;
    end-pi;

    dcl-c colFlag '  1 2 3 4 5 6 7 8';
    dcl-c rowFlag 'ABCDEFGH';

    dcl-s dsplyValue VarChar(20);

    dcl-ds rowsdata qualified;
        colFlag like(R1RowFields.R1COLHDG);
        row like(R1RowFields.R1ROW1) dim(rowcount);
    end-ds;


    //R1RowFields.R1COLHDG = colFlag;
    rowsdata.colFlag = colFlag;

    IN fileData;
    for i = 1 to rowcount;
        rowsdata.row(i) = %subst(rowFlag:i:1);

        for j = 1 to seatcount;
           rowsdata.row(i) = %trim(rowsdata.row(i)) + ' ' + fileData.row(i).seat(j);
        endfor;

        //dsply rowsdata.row(i);
    endfor;

    R1RowFields = rowsdata;
    moveDataToScreenFields();
    return;

end-proc BuildFileData;

dcl-proc resetFileData;

    IN *LOCK fileData;
    for i = 1 to rowcount;
        for j = 1 to seatcount;
            fileData.row(i).seat(j) = SeatOpen + SeatSeparator;
        endfor;
    endfor;

    OUT fileData;

    return;

end-proc resetFileData;

dcl-proc processScreenInput;

    dcl-pi *n ;
    end-pi;

    Select;
        When UpdateKey;
            moveDataFromScreenFields();
            verifySeatAvailability();

        When RefreshKey;
            // Rebuild display data
            BuildFileData();
    EndSl;

    return;

end-proc processScreenInput;

dcl-proc verifySeatAvailability;
    dcl-pi *n ;
    end-pi;

    return;

end-proc verifySeatAvailability;

dcl-proc moveDataToScreenFields;
    dcl-pi *n ;
    end-pi;

    R1ROW1 = R1RowFields.R1ROW1;
    R1ROW2 = R1RowFields.R1ROW2;
    R1ROW3 = R1RowFields.R1ROW3;
    R1ROW4 = R1RowFields.R1ROW4;
    R1ROW5 = R1RowFields.R1ROW5;
    R1ROW6 = R1RowFields.R1ROW6;
    R1ROW7 = R1RowFields.R1ROW7;
    R1ROW8 = R1RowFields.R1ROW8;

    return;
end-proc moveDataToScreenFields;

dcl-proc moveDataFromScreenFields;
    dcl-pi *n ;
    end-pi;

    R1RowFields.R1ROW1 = R1ROW1;
    R1RowFields.R1ROW2 = R1ROW2;
    R1RowFields.R1ROW3 = R1ROW3;
    R1RowFields.R1ROW4 = R1ROW4;
    R1RowFields.R1ROW5 = R1ROW5;
    R1RowFields.R1ROW6 = R1ROW6;
    R1RowFields.R1ROW7 = R1ROW7;
    R1RowFields.R1ROW8 = R1ROW8;

    return;
end-proc moveDataFromScreenFields;

dcl-proc FormatDataWithSeperator;
    dcl-pi *n like(outData);
        p_inData Char(seatcount);
    end-pi;

    dcl-s i int(10);
    dcl-s tempChar Char(1);
    dcl-s outData VarChar(seatcount + %len(SeatSeparator) * (seatcount - 1));

    outData = '';

    for i = 1 to %len(inData);
        tempChar = %subst(inData:i:1);
        outData = outData + tempChar;
        if i < %len(inData);
            outData = outData + ' ';
        endif;
    endfor;

    return outData;
end-proc FormatDataWithSeperator;

dcl-proc FormatDataWithoutSeperator;
    dcl-pi *n ;
        inData Char(17);
        outData Char(17);
    end-pi;

    dcl-s i int(10);
    dcl-s tempChar Char(1);

    outData = '';

    for i = 1 to %len(inData);
        tempChar = %subst(inData:i:1);
        if tempChar <> ' ';
            outData = outData + tempChar;
        endif;
    endfor;

    return;
end-proc FormatDataWithoutSeperator;

