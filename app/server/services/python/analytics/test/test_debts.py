import pytest
from src.logic.debt import generate_debt_payoff_stages
from src.models.schemas import BadRequestError, DebtPayoffRequest, DebtPayoffResponse

class TestDebts:
    def test_generate_debt_payoff(self, mock_debt_payoff_request):
        result = generate_debt_payoff_stages(mock_debt_payoff_request)

        assert result.id == mock_debt_payoff_request.id
        assert result.category == mock_debt_payoff_request.category
        assert len(result.debtStages) > 0

        # final debt should be zero
        assert result.debtStages[-1].remainingDebt == 0


    def test_generate_debt_payoff_no_interest(self, mock_debt_payoff_request):
        mock_debt_payoff_request.interestRate = 0

        result = generate_debt_payoff_stages(mock_debt_payoff_request)

        # No interest should be charged
        for stage in result.debtStages:
            assert stage.interestAmount == 0

        assert len(result.debtStages) == 5  


    def test_last_payment_adjustment(self, mock_debt_payoff_request):
        mock_debt_payoff_request.remainingAmount = 450
        mock_debt_payoff_request.minimumPayment = 200
        mock_debt_payoff_request.interestRate = 0

        result = generate_debt_payoff_stages(mock_debt_payoff_request)

        last_stage = result.debtStages[-1]

        # Last payment should exactly clear the debt
        assert last_stage.remainingDebt == 0
        assert last_stage.principalAmount <= mock_debt_payoff_request.minimumPayment


    def test_min_payment_too_low(self, mock_debt_payoff_request):
        mock_debt_payoff_request.minimumPayment = 1
        mock_debt_payoff_request.interestRate = 100  # Very high interest

        with pytest.raises(BadRequestError) as exc:
            generate_debt_payoff_stages(mock_debt_payoff_request)

        assert "too low" in str(exc.value)


