Dcl-Proc ProcessFunctionKey;
  select;
    //--- F3 or F12: Exit, close down program -----------------------
    when (Key = F03 or Key = F12);
      CloseDownPgm();
      *inlr = *on;
      return;
    //--- F5: Refresh all search fields ----------------------
    when Key = F05;
      clear LastSearchCriteria;
      NewSearchCriteria = *on;
      SflClear();
    //--- F7: Toggle Sort Sequence ---------------------------
    when Key = F07;
      if SQLSortSeq=SortbyName;
        SQLSortSeq = SortbyCode;
        SC_SORTED = SortbyCode;
        scCodeHi = *on;
        scNameHi = *off;
        F7Text2 = SortbyName;
      else;
        SQLSortSeq = SortbyName;
        SC_SORTED = SortbyName;
        scNameHi = *on;
        scCodeHI = *off;
        F7Text2 = SortbyCode;
      endif;
      F7Text = F7TEXT1 + F7Text2;
      BldFkeyText();
      NewSearchCriteria = *on;
      SflClear();
    //--- Other keys: Function key not active message ---------
    other;
      SflMsgSnt= SndSflMsg('DEM0003');
  endsl;
End-Proc;
