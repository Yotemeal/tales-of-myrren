# HUD and duplicate-navigation correction

- Removed the duplicate Gear/Pack/Skills/Jobs/Party rail from modal windows.
- Kept the five persistent HUD shortcuts and added selected-screen highlighting.
- Health/XP bars and name/menu controls now occupy separate layout rows.
- Windows reserve space above the HUD using shared responsive height and bottom-offset values.
- Reclaimed the removed rail/row in desktop, phone portrait and phone landscape windows.
- Party remains available through Settings; controller shoulder-button screen cycling remains intact, and controller focus includes the HUD and banknote toggle.

Validation: syntax and combat/bank regression suites pass. Browser checks at 393x852 and 852x393 show 6px between XP and shortcuts and 16px between window and HUD, zero duplicate tab rails, successful HUD navigation and Settings-to-Party navigation. Save, combat, simulation and storage functions remain unchanged.

Physical iPhone safe-area behaviour and controller hardware were not directly exercised.
