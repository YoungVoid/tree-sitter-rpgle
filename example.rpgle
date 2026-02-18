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
