(function () {
    // 환경 변수 주입을 위한 전역 설정. 배포 시 Render 대시보드 환경변수 사용 권장.
    // window.SUPABASE_URL, window.SUPABASE_ANON_KEY를 설정하면 활성화됩니다.
    const url = window.SUPABASE_URL || "";
    const key = window.SUPABASE_ANON_KEY || "";
    if (url && key && window.supabase) {
        window.sb = window.supabase.createClient(url, key);
    } else {
        window.sb = null; // 미설정 시 로컬스토리지 fallback
    }
})();
