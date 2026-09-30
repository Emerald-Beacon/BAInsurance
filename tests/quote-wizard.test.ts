// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyLineSelection, collectValues } from '../src/scripts/quote-wizard';

function buildForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form id="quote-form">
      <input name="first-name" value="Jane" />
      <fieldset class="quote-line-fields" data-line="auto" hidden disabled>
        <input name="auto-vehicle-1" />
        <input type="checkbox" name="auto-sr22-needed" value="Yes" />
      </fieldset>
      <fieldset class="quote-line-fields" data-line="boat" hidden disabled>
        <input name="boat-length" />
        <select name="boat-type"><option value=""></option><option value="Pontoon">Pontoon</option></select>
        <textarea name="boat-notes"></textarea>
      </fieldset>
      <fieldset class="quote-line-fields" data-line="commercial" hidden disabled>
        <input type="checkbox" name="commercial-coverages" value="General liability" />
        <input type="checkbox" name="commercial-coverages" value="Cyber liability" />
      </fieldset>
    </form>`;
  return document.getElementById('quote-form') as HTMLFormElement;
}

describe('applyLineSelection', () => {
  let form: HTMLFormElement;
  beforeEach(() => { form = buildForm(); });

  const set = (id: string) => form.querySelector<HTMLFieldSetElement>(`[data-line="${id}"]`)!;

  it('enables and reveals the selected line', () => {
    applyLineSelection(form, 'boat');
    expect(set('boat').disabled).toBe(false);
    expect(set('boat').hidden).toBe(false);
  });

  it('leaves every other line disabled and hidden', () => {
    applyLineSelection(form, 'boat');
    expect(set('auto').disabled).toBe(true);
    expect(set('auto').hidden).toBe(true);
  });

  it('clears the previous line when the selection changes', () => {
    applyLineSelection(form, 'boat');
    (form.querySelector('[name="boat-length"]') as HTMLInputElement).value = '23 ft';
    (form.querySelector('[name="boat-type"]') as HTMLSelectElement).value = 'Pontoon';
    (form.querySelector('[name="boat-notes"]') as HTMLTextAreaElement).value = 'ski boat';

    applyLineSelection(form, 'auto');

    expect((form.querySelector('[name="boat-length"]') as HTMLInputElement).value).toBe('');
    expect((form.querySelector('[name="boat-type"]') as HTMLSelectElement).value).toBe('');
    expect((form.querySelector('[name="boat-notes"]') as HTMLTextAreaElement).value).toBe('');
  });

  it('unchecks checkboxes on the abandoned line', () => {
    applyLineSelection(form, 'commercial');
    const boxes = form.querySelectorAll<HTMLInputElement>('[name="commercial-coverages"]');
    boxes.forEach((b) => { b.checked = true; });
    applyLineSelection(form, 'auto');
    boxes.forEach((b) => expect(b.checked).toBe(false));
  });

  it('never clears fields outside the line fieldsets', () => {
    applyLineSelection(form, 'boat');
    applyLineSelection(form, 'auto');
    expect((form.querySelector('[name="first-name"]') as HTMLInputElement).value).toBe('Jane');
  });

  it('disables every line when given an unknown id', () => {
    applyLineSelection(form, 'nope');
    form.querySelectorAll<HTMLFieldSetElement>('.quote-line-fields')
      .forEach((f) => expect(f.disabled).toBe(true));
  });
});

describe('collectValues', () => {
  it('omits fields inside disabled fieldsets', () => {
    const form = buildForm();
    applyLineSelection(form, 'boat');
    (form.querySelector('[name="boat-length"]') as HTMLInputElement).value = '23 ft';
    const values = collectValues(form);
    expect(values['boat-length']).toBe('23 ft');
    expect(values['auto-vehicle-1']).toBeUndefined();
  });

  it('gathers repeated checkbox names into an array', () => {
    const form = buildForm();
    applyLineSelection(form, 'commercial');
    form.querySelectorAll<HTMLInputElement>('[name="commercial-coverages"]')
      .forEach((b) => { b.checked = true; });
    expect(collectValues(form)['commercial-coverages'])
      .toEqual(['General liability', 'Cyber liability']);
  });

  it('returns a single checked box as a one-element array', () => {
    const form = buildForm();
    applyLineSelection(form, 'commercial');
    (form.querySelector('[value="Cyber liability"]') as HTMLInputElement).checked = true;
    expect(collectValues(form)['commercial-coverages']).toEqual(['Cyber liability']);
  });
});
