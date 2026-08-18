import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ApiDocsViewer from './ApiDocsViewer';
import { renderWithProviders, createAuthContext } from '../test/helpers';
import * as openApiService from '../services/openApiService';

// rapidoc registriert ein Custom Element und zieht ~850 kB Code; im Test wird
// nur das Zusammenspiel mit der Spec und dem Token geprüft.
vi.mock('rapidoc', () => ({}));
vi.mock('../services/openApiService');
vi.mock('./ApiDocsViewer.css', () => ({}));

// Ohne registriertes Custom Element wäre <rapi-doc> ein nacktes HTMLElement
// ohne loadSpec(); der Effekt würde werfen und React die Komponente abräumen.
class RapiDocStub extends HTMLElement {
  loadSpec() {}
}

if (!customElements.get('rapi-doc')) {
  customElements.define('rapi-doc', RapiDocStub);
}

const spec = { openapi: '3.0.0', info: { title: 'Essencium API', version: '1' } };

const VALID_JWT = 'aaa.bbb.ccc';

const render = (token = VALID_JWT) =>
  renderWithProviders(<ApiDocsViewer />, { authContext: createAuthContext({ token }) });

const rapidocElement = () => document.querySelector('rapi-doc');

describe('ApiDocsViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openApiService.getOpenApiSpec.mockResolvedValue(spec);
  });

  it('zeigt einen Loader, während die Spec geladen wird', () => {
    openApiService.getOpenApiSpec.mockReturnValue(new Promise(() => {}));

    render();

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('rendert das rapi-doc-Element und übergibt die Spec', async () => {
    render();

    await waitFor(() => expect(rapidocElement()).toBeInTheDocument());
    expect(openApiService.getOpenApiSpec).toHaveBeenCalledTimes(1);
  });

  it('zeigt die Fehlermeldung, wenn die Spec nicht geladen werden kann', async () => {
    openApiService.getOpenApiSpec.mockRejectedValue(
      new Error('Fehler beim Laden der API-Dokumentation')
    );

    render();

    expect(await screen.findByText('Fehler beim Laden der API-Dokumentation')).toBeInTheDocument();
    expect(rapidocElement()).not.toBeInTheDocument();
  });

  // jssecurity:S5696 – nur streng validierte JWTs dürfen in DOM-Attribute.
  it('schreibt einen gültigen Token als api-key-value in das DOM-Attribut', async () => {
    render(VALID_JWT);

    await waitFor(() => expect(rapidocElement()).toBeInTheDocument());
    await waitFor(() =>
      expect(rapidocElement().getAttribute('api-key-value')).toBe(`Bearer ${VALID_JWT}`)
    );
    expect(rapidocElement().getAttribute('api-key-name')).toBe('Authorization');
    expect(rapidocElement().getAttribute('api-key-location')).toBe('header');
  });

  it('schreibt keinen Token in das DOM, wenn er die JWT-Validierung nicht besteht', async () => {
    render('"><script>alert(1)</script>');

    await waitFor(() => expect(rapidocElement()).toBeInTheDocument());
    expect(rapidocElement().getAttribute('api-key-value')).toBeNull();
  });

  it('schreibt keinen Token in das DOM, wenn keiner vorhanden ist', async () => {
    render(null);

    await waitFor(() => expect(rapidocElement()).toBeInTheDocument());
    expect(rapidocElement().getAttribute('api-key-value')).toBeNull();
  });
});
