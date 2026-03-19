ctl-opt DftActGrp(*no) ActGrp('QILE') BndDir('UTIL_BND':'SQL_BND':'SRV_BASE36');
ctl-opt Option(*nounref: *nodebugio: *srcstmt);
ctl-opt ExprOpts(*ResDecPos) ExtBinInt( *Yes );
ctl-opt Debug(*constants : *retval);
ctl-opt Indent('| ');
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt debug option(*nodebugio: *srcstmt)
ctl-opt debug option(*nodebugio: *srcstmt)
ctl-opt debug option(*nodebugio: *srcstmt)
ctl-opt debug  option(*nodebugio: *srcstmt) dftactgrp(*no)
ctl-opt debug  option(*nodebugio: *srcstmt) dftactgrp(*no)
ctl-opt debug nomain option(*nodebugio: *srcstmt) ;
ctl-opt option(*nodebugio: *srcstmt)
ctl-opt BndDir('UTIL_BND');
ctl-opt DftActGrp(*NO) ActGrp(*new) option(*nodebugio: *srcstmt)
ctl-opt BndDir('UTIL_BND');
Ctl-Opt NoMain;
Ctl-Opt NoMain;
ctl-opt option(*srcstmt) actgrp(*new) main(Prt);
ctl-opt option(*srcstmt) actgrp(*new) main(Prt);
ctl-opt option(*srcstmt) actgrp(*new) main(Prt);
ctl-opt option(*srcstmt: *nodebugio)
ctl-opt option(*srcstmt: *nodebugio)
ctl-opt option(*srcstmt: *nodebugio) actgrp(*new) main(Main);
 Ctl-Opt DEBUG(*YES) OPTION(*NODEBUGIO:*SRCSTMT:*NOUNREF);
 Ctl-Opt DFTACTGRP(*NO) ACTGRP(*NEW);
Ctl-Opt DEBUG(*YES) OPTION(*NODEBUGIO:*SRCSTMT:*NOUNREF);
Ctl-Opt DFTACTGRP(*NO) ACTGRP(*NEW);
       Ctl-Opt OPTION(*NODEBUGIO: *SRCSTMT);
       Ctl-Opt DFTACTGRP(*NO) ACTGRP(*NEW);
  // Any program that call this service *must not* be in the default activation group, otherwise the arrary will be loaded every call. So code `ctl-opt DftActGrp(*NO) ActGrp(...)`.
ctl-opt option(*NoDebugIo: *srcstmt)
Ctl-Opt DftActGrp(*NO) ActGrp(*CALLER) option(*nodebugio: *srcstmt);
Ctl-Opt BndDir('UTIL_BND');
ctl-opt nomain option(*nodebugio: *srcstmt);
ctl-opt  option(*NoDebugIo: *SrcStmt :*NoUnref) indent(' |')
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt nomain option(*nodebugio: *srcstmt);
ctl-opt DftActGrp(*NO) ActGrp(*CALLER) option(*nodebugio: *srcstmt)
ctl-opt nomain
ctl-opt nomain option(*nodebugio: *srcstmt);
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt nomain option(*nodebugio:*srcstmt) 
ctl-opt DftActGrp(*NO) ActGrp(*new) // <--- Needed 
Ctl-Opt option(*nodebugio) dftactgrp(*no) actgrp(*caller);
 ctl-opt option(*nodebugio:*srcstmt) dftactgrp(*no) actgrp(*caller)
 ctl-opt option(*nodebugio:*srcstmt) dftactgrp(*no) actgrp(*caller)
ctl-opt option(*nodebugio:*srcstmt) dftactgrp(*no) actgrp(*caller)
ctl-opt dftactgrp(*no) actgrp(*caller) option(*nodebugio: *srcstmt)
ctl-opt
ctl-opt debug option(*nodebugio: *srcstmt)
Ctl-Opt option(*nodebugio) dftactgrp(*no) actgrp(*caller);
