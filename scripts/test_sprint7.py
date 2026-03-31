# test_sprint7.py
# Playwright script testing the Bíblia Viva "Minhas Notas" Sprint 7 feature
from playwright.sync_api import sync_playwright

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\n[E2E] Starting Sprint 7 (Notes & Highlights) integration test...")

        # 1. Navigate to a known verse
        page.goto('http://localhost:5173/acf/jhn/3')
        page.wait_for_load_state('networkidle')

        print("✓ Page loaded.")

        # 2. Select a verse to open toolbar
        # The selector is specific to the reading page verse container
        verse = page.locator('[data-verse="16"]').first
        verse.click()
        
        # 3. Wait for VerseToolbar and click "Anotar"
        toolbar_note_btn = page.locator('button:has-text("Anotar")')
        toolbar_note_btn.wait_for(state='visible')
        toolbar_note_btn.click()
        print("✓ Opened Note modal.")

        # 4. Write note and save
        textarea = page.locator('textarea[placeholder*="reflexão"]')
        textarea.wait_for(state='visible')
        textarea.fill("Teste de nota pelo Playwright E2E.")
        
        save_btn = page.locator('button:has-text("Salvar")')
        save_btn.click()
        print("✓ Saved anonymous note.")

        # Wait for modal to close
        textarea.wait_for(state='hidden')

        # 5. Navigate to MyNotesPage
        page.goto('http://localhost:5173/minhas-notas')
        page.wait_for_load_state('networkidle')

        # 6. Verify note appears in the list
        note_text = page.locator('text="Teste de nota pelo Playwright E2E."')
        note_text.wait_for(state='visible')
        print("✓ Verified note exists in /minhas-notas page.")

        # 7. Test Export buttons are present
        export_txt = page.locator('button:has-text("TXT")')
        export_psf = page.locator('button:has-text("PDF")')
        assert export_txt.is_visible(), "TXT export button missing"
        assert export_psf.is_visible(), "PDF export button missing"
        print("✓ Verified Export buttons are present.")

        print("\nAll tests passed successfully! ✨\n")
        browser.close()

if __name__ == "__main__":
    run_tests()
